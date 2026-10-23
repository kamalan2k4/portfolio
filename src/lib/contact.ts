import { z } from "zod";

export const MIN_FILL_MS = 2500;

export const contactSchema = z.object({
  kind: z.enum(["general", "project", "role"]),
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email address.").max(160),
  budget: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().min(20, "Please write at least 20 characters.").max(4000),
  /** Honeypot: real users never see or fill this. */
  website: z.string().max(500).optional().default(""),
  /** Client timestamp when the form was rendered (bot time-trap). */
  startedAt: z.number().int().positive(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Plain-text email body; never rendered as HTML, so user input can't inject markup. */
export function formatContactEmail(input: ContactInput) {
  const lines = [
    `Type: ${input.kind}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.budget ? `Budget / timeline: ${input.budget}` : null,
    "",
    input.message,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
