#!/usr/bin/env bash
# Builds the kit into a Next.js test app and checks it. usage: selftest.sh <app dir>
# An empty or missing folder is set up as a bare Next.js app first. The app gets the kit's
# files, the example essay, and the two templates rendered for the slug the-page-is-the-essay.
set -euo pipefail
APP=$(realpath "${1:?usage: selftest.sh <app dir>}")
SKILL=$(dirname "$(dirname "$(realpath "$0")")")
KIT=$SKILL/assets/kit EX=$SKILL/assets/example
SLUG=the-page-is-the-essay TITLE="The Page Is the Essay" TOKEN=k3v9q2m7xa
FIRST=/essays/$SLUG UNLISTED=/essays/$SLUG/$TOKEN
mkdir -p "$APP"
cd "$APP"
# an empty folder becomes a bare Next.js app first (one npm install, about 30 s)
if [ ! -e package.json ]; then
  cat > package.json <<'JSON'
{
  "name": "essay-page-selftest",
  "private": true,
  "dependencies": { "next": "16.3.5", "react": "19.2.0", "react-dom": "19.2.0", "server-only": "^0.0.1" },
  "devDependencies": { "@types/node": "^24.3.0", "@types/react": "^19.1.12", "@types/react-dom": "^19.1.9", "typescript": "^5.9.2" }
}
JSON
fi
if [ ! -e tsconfig.json ]; then
  cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "dom.iterable", "esnext"], "allowJs": true, "skipLibCheck": true,
    "strict": true, "noEmit": true, "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "jsx": "react-jsx", "incremental": true,
    "plugins": [{ "name": "next" }], "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
JSON
fi
[ -e node_modules ] || nice -n 19 npm install --no-audit --no-fund --loglevel=error
PIDS=()
stop() { for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null || true; done; }
trap stop EXIT

echo "-- colour: contrast and token hygiene"
node "$SKILL/scripts/check_contrast.mjs" "$KIT/files/app/essay-tokens.css" "$KIT/files/app/essay.css" "$EX/$SLUG.config.json" "$KIT/templates/config.json"
if grep -rnE -- '--(cv|rz)-' "$KIT/files/"; then echo "selftest: --cv-/--rz- left in files/" >&2; exit 1; fi
if grep -nE '#[0-9A-Fa-f]{3,8}\b' "$KIT/files/app/essay.css"; then echo "selftest: hard-coded colour in essay.css" >&2; exit 1; fi

echo "-- copy the kit in"
rm -rf .next
cp -r "$KIT/files/." .
[ -f app/layout.tsx ] || printf 'export default function Layout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body style={{ margin: 0 }}>{children}</body>\n    </html>\n  );\n}\n' > app/layout.tsx
render() { sed -e "s/{{slug}}/$SLUG/g" -e "s/{{title}}/$TITLE/g" -e "s/{{description}}/A test essay./g" -e "s/{{token}}/$TOKEN/g" "$1" > "$2"; }
mkdir -p "app/essays/$SLUG/$TOKEN" content/essays "public/essays/$SLUG"
render "$KIT/templates/page.tsx" "app/essays/$SLUG/page.tsx"
render "$KIT/templates/unlisted.tsx" "app/essays/$SLUG/$TOKEN/page.tsx"
cp "$EX/$SLUG.json" "$EX/$SLUG.config.json" content/essays/
cp "$EX"/pictures/* "public/essays/$SLUG/"

echo "-- tsc"
OUT=$(nice -n 19 npx tsc --noEmit 2>&1) || true
[ -z "$OUT" ] || { echo "$OUT"; echo "selftest: tsc printed output" >&2; exit 1; }

echo "-- next build"
nice -n 19 npx next build > build.log 2>&1 || { tail -40 build.log; echo "selftest: build failed" >&2; exit 1; }
tail -12 build.log

# start next on a port from this app, wait for it, and remember the pid that holds the port
serve() { # port, env assignments...
  local port=$1; shift
  env "$@" nice -n 19 ./node_modules/.bin/next start -p "$port" > "server-$port.log" 2>&1 &
  PIDS+=($!)
  for _ in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:$port/" && break; sleep 1; done
  # the pid that holds the port too, where ss is there to ask (Linux)
  local held; held=$( (ss -ltnp "sport = :$port" 2>/dev/null || true) | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1)
  if [ -n "$held" ]; then PIDS+=("$held"); fi
}
get() { curl -s -o body.html -w '%{http_code}' "http://127.0.0.1:$1$2"; }
want() { [ "$1" = "$2" ] || { echo "selftest: $3: got $1, want $2" >&2; exit 1; }; echo "ok  $3 -> $1"; }
has() { grep -q -- "$1" body.html || { echo "selftest: $2: no '$1' in the page" >&2; exit 1; }; echo "ok  $2 has '$1'"; }

echo "-- preview (VERCEL_ENV=preview, port 3191)"
serve 3191 VERCEL_ENV=preview
want "$(get 3191 "$FIRST")" 200 "preview $FIRST"; has lt-root "preview page"; has Draft "preview page"
want "$(get 3191 "$UNLISTED")" 200 "preview $UNLISTED"; has noindex "unlisted page"
stop; PIDS=()

echo "-- production (no VERCEL_ENV, port 3192)"
serve 3192 -u VERCEL_ENV
want "$(get 3192 "$FIRST")" 404 "production $FIRST"
want "$(get 3192 "$UNLISTED")" 200 "production $UNLISTED"; has noindex "unlisted page"
stop; PIDS=()
rm -f body.html
echo "selftest: ok"
