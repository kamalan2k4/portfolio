import { Resend } from "resend";
import { profile } from "@/content/profile";
import { contactSchema, formatContactEmail, MIN_FILL_MS } from "@/lib/contact";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const MAX_BODY_BYTES = 10_000;

const json = (status: number, body: Record<string, unknown>, headers?: HeadersInit) => Response.json(body, { status, headers });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { error: "Unsupported content type." });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: "Message is too long." });

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return json(422, { error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors });
  }
  const input = parsed.data;
  const now = Date.now();

  // Bots: honeypot filled or submitted impossibly fast. Answer as if it worked.
  if (input.website || now - input.startedAt < MIN_FILL_MS) return json(200, { ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rl = limiter(ip, now);
  if (!rl.ok) return json(429, { error: "Too many messages. Please try again later." }, { "Retry-After": String(rl.retryAfter) });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return json(503, { error: "Email delivery is not configured.", fallback: "mailto" });

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: process.env.CONTACT_TO_EMAIL || profile.email,
      replyTo: input.email,
      subject: `[Portfolio] ${input.kind === "project" ? "Project enquiry" : "Message"} from ${input.name}`,
      text: formatContactEmail(input),
    });
    if (error) throw new Error(error.message);
    return json(200, { ok: true });
  } catch (err) {
    console.error("contact: send failed", err instanceof Error ? err.message : err);
    return json(502, { error: "Couldn't send right now.", fallback: "mailto" });
  }
}
