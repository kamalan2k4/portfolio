import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">{title}</h1>
      {children && <div className="mt-5 text-lg leading-relaxed text-stone/80">{children}</div>}
    </header>
  );
}

export function Section({ id, title, eyebrow, children, className = "" }: { id?: string; title: string; eyebrow?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`scroll-mt-24 pt-16 ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id ? `${id}-title` : undefined} className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
