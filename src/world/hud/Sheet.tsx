"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal sheet built on the native <dialog>: focus trap, Esc to close and inert
 * background come from the platform. Side sheet on desktop, bottom sheet on mobile.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  variant = "side",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  variant?: "side" | "center";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const layout =
    variant === "side"
      ? "mt-auto h-[82dvh] max-h-[82dvh] w-full max-w-none rounded-t-2xl sm:mt-0 sm:mr-0 sm:ml-auto sm:h-dvh sm:max-h-dvh sm:max-w-[480px] sm:rounded-none sm:rounded-l-2xl"
      : "m-auto max-h-[86dvh] w-[min(640px,calc(100vw-24px))] rounded-2xl";

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`${layout} overflow-hidden border border-line bg-[var(--glass-strong)] p-0 text-stone shadow-2xl backdrop:bg-night/40 backdrop:backdrop-blur-[2px]`}
    >
      {open && <div className="flex h-full max-h-[inherit] flex-col">{children}</div>}
    </dialog>
  );
}

export function SheetHeader({ id, eyebrow, title, onClose, onBack }: { id: string; eyebrow?: string; title: string; onClose: () => void; onBack?: () => void }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-1 text-sm text-stone-dim hover:text-stone">
            ← Back
          </button>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="mt-1 font-display text-2xl font-bold tracking-tight">
          {title}
        </h2>
      </div>
      <button type="button" onClick={onClose} className="btn btn-ghost -mr-1 h-11 w-11 shrink-0 p-0" aria-label="Close">
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </header>
  );
}
