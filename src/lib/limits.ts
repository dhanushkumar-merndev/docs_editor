export const MAX_DOCUMENT_MEMBERS = 10;
export const MAX_IMAGES_PER_DOCUMENT = 60;
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export const RATE_LIMITS = {
  createDocument: { limit: 10, windowMs: 60 * 1000 },
  shareDocument: { limit: 20, windowMs: 60 * 1000 },
  imageUpload: { limit: 20, windowMs: 60 * 60 * 1000 },
  search: { limit: 60, windowMs: 60 * 1000 },
} as const;

export function imageSizeLimitLabel() {
  return "2 MB";
}
