# Previewing, sharing and publishing

An essay page goes through three states. The author decides when it moves from one to the next;
never publish because the page looks done.

| State | Main route `/essays/<slug>` | Unlisted route `/essays/<slug>/<token>` |
|---|---|---|
| Draft (default) | 404 on production; shown with a Draft tag in local dev and on preview builds | Live on production, noindex, linked from nowhere |
| Published | Live | Deleted |

## 1. The switch

The route file holds:

```tsx
const PUBLISHED = false;
const DRAFT_OK = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
...
if (!PUBLISHED) {
  await connection();          // a draft reads the environment on each request
  if (!DRAFT_OK) notFound();
}
```

While a draft, the route is rendered per request, so one build answers 404 on production and the
page on a preview (`VERCEL_ENV=preview npx next start`). Once `PUBLISHED` is true the page is static
again. The reference page was static in both states, which meant a preview had to be built with
`VERCEL_ENV=preview`, and setting it only on `next start` still gave 404; the `connection()` call
removes that trap.

## 2. Looking at it locally

```bash
tmux new-session -d -s essay-dev -c <repo> "npx next dev -p 3112 2>&1 | tee logs/essay-dev.log"
until curl -s -o /dev/null --max-time 120 -w '%{http_code}' http://localhost:3112/essays/<slug> | grep -q 200; do sleep 3; done
node <skill>/scripts/shoot.mjs http://localhost:3112/essays/<slug> shots/ --widths 1440,390
node <skill>/scripts/shoot.mjs http://localhost:3112/essays/<slug> shots/dark --widths 1440,390 --dark
```

The first compile in dev is slow (up to a minute or two). Then Read the PNGs: the title card, a few
frames down the essay, and the full page at each width, light and dark. Look for: text over a busy
part of a picture, a caption on two lines, a portrait too small to see, uneven gaps, a band that
starts or ends in the wrong place, sideways scroll on the phone, and anything the author has already
said no to. `shoot.mjs` exits 1 on a page error or sideways overflow.

Stop servers you start by their pid (`ss -ltnp | rg ':3112 '`), then end the tmux session. Do not use
`pkill -f`: it can match the shell running it.

## 3. Sharing a draft

**The unlisted copy** is the default share link: a second route folder with a random 10-character
name, live on production, marked noindex and nofollow, linked from nowhere. It stays up with the
author's laptop off. `scripts/init_essay.py` makes it. Each production deploy updates it. Delete the
folder when the essay is published.

Keep the token out of anything public: commit messages, docs, social posts. Note that a public
repository makes the folder name visible to anyone who reads it; if that matters, keep the repository
private or accept that "unlisted" means "not linked".

**A tunnel** shows a local build to someone right now, without deploying:

```bash
VERCEL_ENV=preview npx next build > logs/build.log 2>&1
tmux new-session -d -s essay-share -n server "VERCEL_ENV=preview npx next start -p 3111 2>&1 | tee logs/server.log"
tmux new-window -t essay-share -n tunnel "cloudflared tunnel --no-autoupdate --url http://localhost:3111 2>&1 | tee logs/tunnel.log"
grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' logs/tunnel.log | head -1
```

The address changes on every tunnel start and dies with the laptop. After a rebuild, stop the old
server by pid and wait for it to exit before checking the public address: the tunnel can serve the
old process for a short while. Check the new text is live with `curl -s <url> | rg -o '<one word>'`
(the page wraps each word in its own span, so search single words).

Vercel preview deployments sit behind Vercel's login by default, so they do not work as share links.

## 4. Deploying

Deploy a commit, never the working tree: other work in the repo (untracked pictures, half-finished
pages from other sessions) would ship with it, and `git push` alone may deploy nothing, depending on
the project.

```bash
S=$(mktemp -d)
git archive HEAD | tar -x -C "$S"
mkdir -p "$S/.vercel" && cp .vercel/project.json "$S/.vercel/"
cd "$S" && timeout 540 npx vercel deploy --prod --yes > "$S.log" 2>&1
rg '"readyState": "READY"|"target": "production"' "$S.log"
```

Run it in the background; it often takes longer than two minutes. `vercel ls` can hang; read the
deploy log instead.

**Check after every deploy:**

```bash
for u in https://<site>/essays/<slug>/<token> https://<site>/essays/<slug> https://<site>/; do
  curl -s -m 45 -o /dev/null -w "%{http_code} $u\n" "$u"
done
curl -s -m 45 https://<site>/essays/<slug>/<token> | rg -o '<meta name="robots"[^>]*>'
```

While a draft: unlisted 200, main route 404, home 200, robots `noindex, nofollow`. Retry a timeout
(exit 28) up to three times before calling it a failure.

## 5. Publishing

Only when the author says so.

1. Sync the note one last time and run `scripts/check_essay.py`.
2. Set `PUBLISHED = true` in the route file.
3. Delete the unlisted folder.
4. Link the essay from wherever the site lists its writing.
5. If the views module is on, set the essay's count to 0: draft visits counted.
6. Commit, deploy (section 4), and check: main route 200, unlisted 404.

## 6. Views and comments (optional)

Install with `init_essay.py --talk`: it copies the module in and turns on the count and the
comments in both route files. Two tables in a Turso (libSQL) store, reached over its HTTP
pipeline API with `fetch`, so there is no driver package.

- `scripts/essay-talk-schema.mjs` makes the tables; it is safe to re-run.
  `node --env-file=.env.local scripts/essay-talk-schema.mjs`
- Env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ESSAY_ORIGINS` (comma-separated, the site's real
  origins; comments from anywhere else are refused).
- Outside a production build, `lib/essay/db.ts` refuses any store that is not on this machine unless
  `ESSAY_DB_LIVE=1` is set. A local dev server often has the live keys in its environment; the guard
  keeps a test from writing to the real store. For local runs use the stand-in store the module
  ships (Node 22.5 or newer):

  ```bash
  node scripts/essay-dev-db.mjs --port 4419 --file .dev/essays.db    # in tmux
  TURSO_DATABASE_URL=http://127.0.0.1:4419 TURSO_AUTH_TOKEN=dev node scripts/essay-talk-schema.mjs
  TURSO_DATABASE_URL=http://127.0.0.1:4419 TURSO_AUTH_TOKEN=dev npx next dev
  ```
- Only slugs listed in `lib/essay/slugs.ts` reach the API (`init_essay.py` adds new ones).
- Views: one per browser (localStorage `lt-viewed:<slug>`), the first visit only.
- Comments: name up to 60 characters, comment up to 2000, request up to 8 KiB, three per ten minutes
  per caller (keyed by a hash of address and slug, never the address). A hidden "website" field
  catches bots: a filled one gets a normal-looking reply and nothing is stored. Comments render as
  text only.
- Hide a comment: `UPDATE essay_comments SET hidden = 1 WHERE id = ?`.
- `vercel env pull` can return the Turso variables empty. Run scripts with
  `node --env-file=.env.local` from the repo root instead.

## 7. Working in a shared repo

The site repo usually has other work in progress, sometimes from other sessions running at the same
time.

- Stage files by name (`git add <paths>`), never `git add -A`. Read `git diff --cached` before each
  commit.
- Do not discard a change you did not make (`git checkout -- <file>`) without looking at it first.
- Commit and push each verified step.
- A copy of the repo for previews (with `.env.local` copied in) holds secrets: do not share that
  folder or zip it.
