export type KbKind =
  | "service"
  | "pricing"
  | "faq"
  | "case"
  | "ebook"
  | "process"
  | "note";

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

export type MatchKbRow = {
  id: string;
  kind: KbKind;
  title: string;
  body: string;
  tags: string[];
  serviceSlug: string | null;
  allowPrices: boolean;
  similarity: number;
};
