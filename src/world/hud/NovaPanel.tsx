"use client";

import { useEffect, useRef, useState } from "react";
import { projectBySlug } from "@/content/projects";
import { type NovaAction, type NovaReply, respond, STARTER_SUGGESTIONS } from "@/nova/engine";
import { useWorld } from "../store";
import { Sheet, SheetHeader } from "./Sheet";

type Message = { id: number; from: "nova" | "you"; text: string; action?: NovaAction };

const GREETING: Message = {
  id: 0,
  from: "nova",
  text: "Hi, I'm NOVA. Ask me about Kamalan's projects, skills or experience, or tap a suggestion. I'll answer here and fly you to the right place.",
};

function actionLabel(a: NovaAction) {
  switch (a.type) {
    case "travel":
      return "Take me there";
    case "project":
      return "Open exhibit";
    case "link":
      return a.label;
    case "tour":
      return "Start tour";
    case "map":
      return "Open map";
  }
}

export function NovaPanel() {
  const open = useWorld((s) => s.overlay === "nova");
  const close = useWorld((s) => s.closeOverlay);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [suggestions, setSuggestions] = useState(STARTER_SUGGESTIONS);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, thinking]);

  function run(action: NovaAction) {
    const s = useWorld.getState();
    switch (action.type) {
      case "travel":
        s.travelTo(action.id);
        break;
      case "project": {
        const p = projectBySlug(action.slug);
        if (p) s.openProject(p.slug, p.district);
        break;
      }
      case "link":
        window.open(action.href, "_blank", "noopener,noreferrer");
        break;
      case "tour":
        s.startTour();
        break;
      case "map":
        s.openOverlay("map");
        break;
    }
  }

  function ask(text: string) {
    const q = text.trim();
    if (!q) {
      setError("Type a question or pick a suggestion.");
      return;
    }
    setError(null);
    setDraft("");
    setMessages((m) => [...m, { id: idRef.current++, from: "you", text: q }]);
    setThinking(true);
    // A short beat so the reply reads as a response, not an instant swap.
    window.setTimeout(() => {
      let reply: NovaReply;
      try {
        reply = respond(q);
      } catch {
        reply = { text: "Something went wrong on my side. Try a suggestion, or open the map to jump anywhere.", suggestions: STARTER_SUGGESTIONS };
      }
      setThinking(false);
      setMessages((m) => [...m, { id: idRef.current++, from: "nova", text: reply.text, action: reply.action }]);
      setSuggestions(reply.suggestions.length ? reply.suggestions : STARTER_SUGGESTIONS);
    }, 280);
  }

  return (
    <Sheet open={open} onClose={close} labelledBy="nova-title">
      <SheetHeader id="nova-title" eyebrow="Guide" title="NOVA" onClose={close} />
      <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation with NOVA" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-5">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${m.from === "you" ? "rounded-br-sm bg-stone text-night" : "rounded-bl-sm border border-line bg-night-2"}`}>
              <span className="sr-only">{m.from === "you" ? "You: " : "NOVA: "}</span>
              {m.text}
              {m.action && (
                <div className="mt-3">
                  <button type="button" className="btn btn-primary min-h-10 px-4 py-1.5 text-sm" onClick={() => run(m.action!)}>
                    {actionLabel(m.action)}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <p className="text-sm text-stone-dim" aria-live="off">
            NOVA is thinking…
          </p>
        )}
      </div>

      <div className="border-t border-line px-5 pt-3 pb-4">
        <ul className="mb-3 flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" className="chip min-h-9 cursor-pointer hover:border-aqua hover:text-stone" onClick={() => ask(s)} disabled={thinking}>
                {s}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <label htmlFor="nova-input" className="sr-only">
            Ask NOVA a question
          </label>
          <input
            id="nova-input"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            maxLength={200}
            autoComplete="off"
            placeholder="Ask about projects, skills, AI work…"
            className="field flex-1"
            aria-describedby={error ? "nova-error" : undefined}
          />
          <button type="submit" className="btn btn-primary" disabled={thinking}>
            Ask
          </button>
        </form>
        {error && (
          <p id="nova-error" role="alert" className="mt-2 text-sm text-coral">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}
