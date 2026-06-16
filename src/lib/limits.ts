export const MAX_DOCUMENT_MEMBERS = 10;

export const RATE_LIMITS = {
  createDocument: { limit: 10, windowMs: 60 * 1000 },
  shareDocument: { limit: 20, windowMs: 60 * 1000 },
  search: { limit: 60, windowMs: 60 * 1000 },
} as const;
