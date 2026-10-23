export function mailtoFallback(to: string, input: { name?: string; message?: string; kind?: string }) {
  const subject = encodeURIComponent(`Portfolio ${input.kind === "project" ? "project enquiry" : "message"}${input.name ? ` from ${input.name}` : ""}`);
  const body = encodeURIComponent(input.message ?? "");
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
