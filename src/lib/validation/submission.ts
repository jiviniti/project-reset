import { z } from "zod";

const stableKey = z.string().regex(/^[a-z0-9_]+$/).max(80);

export const answerSchema = z
  .object({
    questionKey: stableKey,
    optionKeys: z.array(stableKey).max(30).optional(),
    text: z.string().trim().max(1_500).optional(),
  })
  .superRefine((answer, context) => {
    const hasOptions = answer.optionKeys !== undefined;
    const hasText = answer.text !== undefined;
    if (hasOptions === hasText) {
      context.addIssue({
        code: "custom",
        message: "Each answer must contain either optionKeys or text.",
      });
    }
  });

export const submissionSchema = z.object({
  apiVersion: z.literal("1"),
  idempotencyKey: z.string().uuid(),
  screeningSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  participant: z.object({
    firstName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
  }),
  demographics: z.object({
    city: z.string().trim().max(120).optional(),
    ageBand: z.enum(["18–24", "25–34", "35–44", "45–54", "55+"]).optional(),
    occupation: z.string().trim().max(120).optional(),
  }),
  consent: z.object({
    dataUseAccepted: z.literal(true),
    policyVersion: stableKey,
  }),
  communication: z.object({
    futureCommunicationsAllowed: z.boolean().default(false),
  }),
  answers: z.array(answerSchema).max(12),
});

export type SubmissionPayload = z.infer<typeof submissionSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
