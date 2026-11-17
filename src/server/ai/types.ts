import { z } from "zod";

export const KB_KINDS = ["service", "pricing", "faq", "case", "ebook", "process", "note"] as const;
export type KbKind = (typeof KB_KINDS)[number];

export type KbEntry = {
  id: string;
  kind: KbKind;
  title: string;
  body: string;
  tags: string[];
  serviceSlug?: string | null;
  allowPrices: boolean;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
  hasEmbedding?: boolean;
};

/** What the admin may send for one entry — shared by POST /api/admin/kb and PUT /api/admin/kb/[id]. */
export const kbInput = z.object({
  id: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9_-]+$/),
  kind: z.enum(KB_KINDS),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  serviceSlug: z.string().max(80).nullable().optional(),
  allowPrices: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
export type KbInput = z.infer<typeof kbInput>;

/** A row the retriever hands the prompt. */
export type KbHit = { id: string; kind: KbKind; title: string; body: string; serviceSlug: string | null; allowPrices: boolean; similarity: number | null };

/** Why a provider call failed — the same labels the AI health panel counts (docs/AI_RAG_SYSTEM.md §8). */
export type AiFailReason = "limit" | "slow" | "bad" | "key" | "down" | "blocked" | "off";

export class AiError extends Error {
  reason: AiFailReason;
  constructor(reason: AiFailReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export type RateInfo = { remainingRequests: number | null; remainingTokens: number | null; resetAt: string | null };
export type ProviderReply = { text: string; tokensIn: number; tokensOut: number; rate: RateInfo | null };
