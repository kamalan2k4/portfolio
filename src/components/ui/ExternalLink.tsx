import type { AnchorHTMLAttributes } from "react";

/** External link that opens in a new tab safely and tells screen readers so. */
export function ExternalLink({ children, className = "hover:text-stone", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
