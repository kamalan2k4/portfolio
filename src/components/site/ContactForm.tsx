"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { mailtoFallback } from "@/lib/mailto";

type Status = { state: "idle" } | { state: "sending" } | { state: "sent" } | { state: "error"; message: string; fallback: boolean; fields?: Record<string, string[]>; draft?: { name: string; message: string } };

export function ContactForm({ kind }: { kind: "general" | "project" }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const startedAt = useRef(0);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status.state === "sent" || status.state === "error") statusRef.current?.focus();
  }, [status.state]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      kind: (fd.get("kind") as string) || kind,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      budget: String(fd.get("budget") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
      startedAt: startedAt.current || Date.now(),
    };
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ state: "sent" });
        form.reset();
        return;
      }
      setStatus({ state: "error", message: body.error ?? "Something went wrong.", fallback: body.fallback === "mailto", fields: body.fields, draft: payload });
    } catch {
      setStatus({ state: "error", message: "Network error.", fallback: true, draft: payload });
    }
  }

  const fieldError = (name: string) => (status.state === "error" ? status.fields?.[name]?.[0] : undefined);
  const sending = status.state === "sending";

  if (status.state === "sent") {
    return (
      <div className="glass p-6">
        <p ref={statusRef} tabIndex={-1} role="status" className="font-display text-xl font-bold">
          Message sent. Thank you!
        </p>
        <p className="mt-2 text-stone-dim">I&apos;ll reply to the email you gave, usually within a day.</p>
        <button type="button" className="btn btn-ghost mt-5" onClick={() => setStatus({ state: "idle" })}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false} className="glass space-y-5 p-6" aria-describedby="form-status">
      {kind === "general" ? (
        <fieldset>
          <legend className="text-sm font-semibold">I&apos;m reaching out about</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["role", "A job opportunity"],
              ["project", "A freelance project"],
              ["general", "Something else"],
            ].map(([v, l], i) => (
              <label key={v} className="chip cursor-pointer gap-2 py-2 has-[:checked]:border-aqua has-[:checked]:text-stone">
                <input type="radio" name="kind" value={v} defaultChecked={i === 0} className="accent-[var(--aqua)]" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="kind" value="project" />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" error={fieldError("name")}>
          <input id="cf-name" name="name" aria-describedby="cf-name-error" aria-invalid={fieldError("name") ? true : undefined} required minLength={2} maxLength={80} autoComplete="name" className="field" />
        </Field>
        <Field label="Email" name="email" error={fieldError("email")}>
          <input id="cf-email" name="email" aria-describedby="cf-email-error" aria-invalid={fieldError("email") ? true : undefined} type="email" required maxLength={160} autoComplete="email" className="field" />
        </Field>
      </div>

      {kind === "project" && (
        <Field label="Budget and timeline (optional)" name="budget" error={fieldError("budget")}>
          <input id="cf-budget" name="budget" aria-describedby="cf-budget-error" aria-invalid={fieldError("budget") ? true : undefined} maxLength={60} placeholder="e.g. 4–6 weeks" className="field" />
        </Field>
      )}

      <Field label={kind === "project" ? "What do you want to build?" : "Message"} name="message" error={fieldError("message")}>
        <textarea id="cf-message" name="message" aria-describedby="cf-message-error" aria-invalid={fieldError("message") ? true : undefined} required minLength={20} maxLength={4000} rows={6} className="field resize-y" />
      </Field>

      {/* Honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={sending} aria-busy={sending}>
          {sending ? "Sending…" : "Send message"}
        </button>
        <p id="form-status" ref={statusRef} tabIndex={-1} role={status.state === "error" ? "alert" : undefined} className="text-sm">
          {status.state === "error" && (
            <>
              <span className="text-coral">{status.message}</span>
              {status.fallback && (
                <>
                  {" "}
                  <a className="link" href={mailtoFallback(profile.email, { kind, ...status.draft })}>
                    Email me directly instead
                  </a>
                </>
              )}
            </>
          )}
        </p>
      </div>
    </form>
  );
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`cf-${name}`} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      <p id={`cf-${name}-error`} className="mt-1 text-sm text-coral empty:hidden">
        {error}
      </p>
    </div>
  );
}
