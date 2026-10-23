import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const valid = () => ({
  kind: "project",
  name: "Ada Lovelace",
  email: "ada@example.com",
  budget: "4 weeks",
  message: "I'd like a RAG assistant over our engineering docs.",
  website: "",
  startedAt: Date.now() - 10_000,
});

let ipCounter = 0;
function req(body: unknown, { type = "application/json", ip }: { type?: string; ip?: string } = {}) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": type, "x-forwarded-for": ip ?? `10.0.0.${++ipCounter}` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function load() {
  vi.resetModules();
  return (await import("./route")).POST;
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: "x" }, error: null });
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_FROM_EMAIL = "Portfolio <hi@example.com>";
  });
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_FROM_EMAIL;
  });

  it("sends a valid message as plain text with reply-to", async () => {
    const POST = await load();
    const res = await POST(req(valid()));
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    const arg = send.mock.calls[0][0];
    expect(arg.replyTo).toBe("ada@example.com");
    expect(arg.text).toContain("RAG assistant");
    expect(arg.html).toBeUndefined();
  });

  it("rejects non-JSON bodies", async () => {
    const POST = await load();
    expect((await POST(req("name=x", { type: "application/x-www-form-urlencoded" }))).status).toBe(415);
    expect((await POST(req("{not json"))).status).toBe(400);
  });

  it("validates fields and reports them", async () => {
    const POST = await load();
    const res = await POST(req({ ...valid(), email: "nope", message: "short" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(["email", "message"]));
    expect(send).not.toHaveBeenCalled();
  });

  it("silently drops honeypot and too-fast submissions", async () => {
    const POST = await load();
    expect((await POST(req({ ...valid(), website: "http://spam" }))).status).toBe(200);
    expect((await POST(req({ ...valid(), startedAt: Date.now() }))).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 503 with a mailto fallback when email isn't configured", async () => {
    delete process.env.RESEND_API_KEY;
    const POST = await load();
    const res = await POST(req(valid()));
    expect(res.status).toBe(503);
    expect((await res.json()).fallback).toBe("mailto");
  });

  it("rate limits repeated submissions from one IP", async () => {
    const POST = await load();
    const statuses = [];
    for (let i = 0; i < 7; i++) statuses.push((await POST(req(valid(), { ip: "203.0.113.9" }))).status);
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });

  it("returns 502 with fallback when the provider fails", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const POST = await load();
    const res = await POST(req(valid()));
    expect(res.status).toBe(502);
    expect((await res.json()).fallback).toBe("mailto");
  });

  it("rejects oversized payloads", async () => {
    const POST = await load();
    expect((await POST(req({ ...valid(), message: "x".repeat(12_000) }))).status).toBe(413);
  });
});
