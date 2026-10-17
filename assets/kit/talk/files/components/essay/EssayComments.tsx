"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

// The comments under the credits: the list, then the form. Comment text is only ever rendered as
// text. The "website" field is a honeypot no reader sees; the server drops anything that fills it.
const NAME_KEY = "lt-name";
const TRY_AGAIN = "That did not go through. Please try again.";

type Comment = { id: number; name: string; body: string; at: string };

const api = (slug: string) => `/api/essays/${slug}/comments`;

const day = (at: string) => {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function EssayComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const button = useRef<HTMLButtonElement>(null);
  const trap = useRef<HTMLInputElement>(null);
  const hadFocus = useRef(false);

  useEffect(() => {
    try { setName(localStorage.getItem(NAME_KEY) ?? ""); } catch {}
    const stop = new AbortController();
    fetch(api(slug), { signal: stop.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => (Array.isArray(data?.comments) ? setComments(data.comments) : setFailed(true)))
      .catch(() => { if (!stop.signal.aborted) setFailed(true); });
    return () => stop.abort();
  }, [slug]);

  // a disabled button drops focus; give it back once the post is done
  useEffect(() => {
    if (!sending && hadFocus.current) {
      hadFocus.current = false;
      button.current?.focus();
    }
  }, [sending]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    hadFocus.current = document.activeElement === button.current;
    setSending(true);
    setNote("");
    try {
      const res = await fetch(api(slug), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, body, website: trap.current?.value ?? "" }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.comment) {
        setComments((list) => [...(list ?? []), data.comment as Comment]);
        setBody("");
        try { localStorage.setItem(NAME_KEY, name.trim()); } catch {}
      } else {
        setNote(typeof data?.error === "string" && data.error ? data.error : TRY_AGAIN);
      }
    } catch {
      setNote(TRY_AGAIN);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="comments" className="lt-comments" aria-labelledby="comments-h">
      <div className="lt-c-in">
        <h2 id="comments-h" className="lt-credits-h">Comments</h2>
        {failed ? (
          <p className="lt-c-empty">Comments are unavailable right now.</p>
        ) : comments === null ? (
          <p className="lt-c-empty">Loading comments.</p>
        ) : (
          <>
            {comments.length ? (
              <ol className="lt-c-list">
                {comments.map((c) => (
                  <li key={c.id} className="lt-c-item">
                    <p className="lt-c-meta">
                      <span className="lt-c-name">{c.name}</span>
                      {day(c.at) ? <time dateTime={c.at}>{day(c.at)}</time> : null}
                    </p>
                    <p className="lt-c-body">{c.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="lt-c-empty">No comments yet.</p>
            )}
            <form className="lt-c-form" onSubmit={submit}>
              <div className="lt-c-field">
                <label htmlFor="lt-c-name">Name</label>
                <input id="lt-c-name" name="name" type="text" maxLength={60} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="lt-c-field">
                <label htmlFor="lt-c-body">Comment</label>
                <textarea id="lt-c-body" name="body" rows={5} maxLength={2000} required value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              <div className="lt-c-hp" aria-hidden="true">
                <label>
                  Website
                  <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
                </label>
              </div>
              <button ref={button} type="submit" className="lt-c-send" disabled={sending}>Post comment</button>
              <p className="lt-c-status" role="status">{note}</p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
