import { describe, expect, it } from "vitest";
import { respond, STARTER_SUGGESTIONS } from "./engine";

describe("NOVA engine", () => {
  it("maps every starter chip to an action", () => {
    for (const chip of STARTER_SUGGESTIONS) {
      const r = respond(chip);
      expect(r.text.length).toBeGreaterThan(10);
      expect(r.action).toBeDefined();
    }
  });

  it("routes common questions to the right place", () => {
    expect(respond("show me your projects").action).toEqual({ type: "travel", id: "innovation" });
    expect(respond("What AI / RAG work have you done?").action).toEqual({ type: "travel", id: "ai-dome" });
    expect(respond("can I hire you for a freelance gig").action).toEqual({ type: "travel", id: "creator-bay" });
    expect(respond("how do I contact him?").action).toEqual({ type: "travel", id: "launch-terminal" });
    expect(respond("download your CV").action).toMatchObject({ type: "link", href: "/resume" });
    expect(respond("give me a guided tour").action).toEqual({ type: "tour" });
  });

  it("recognises projects by name", () => {
    expect(respond("tell me about VINATHI").action).toEqual({ type: "project", slug: "vinathi" });
    expect(respond("what is leadflow crm?").action).toEqual({ type: "project", slug: "leadflow-crm" });
  });

  it("answers technology questions from project stacks", () => {
    const r = respond("do you know docker?");
    expect(r.text).toMatch(/Docker/);
    expect(r.action?.type).toBe("project");
    expect(respond("experience with spring boot").text).toMatch(/Spring Boot/);
  });

  it("falls back helpfully on unknown or empty input", () => {
    expect(respond("what's the weather in Paris").suggestions).toEqual(STARTER_SUGGESTIONS);
    expect(respond("   ").suggestions.length).toBeGreaterThan(0);
  });
});
