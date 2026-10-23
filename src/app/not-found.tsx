import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-xl place-content-center gap-5 px-4 text-center">
      <p className="eyebrow">404 · Off the map</p>
      <h1 className="font-display text-4xl font-bold">This path isn&apos;t on the map.</h1>
      <p className="text-stone-dim">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Back to the world
        </Link>
        <Link href="/recruiter" className="btn btn-ghost">
          Recruiter mode
        </Link>
      </div>
    </main>
  );
}
