import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
