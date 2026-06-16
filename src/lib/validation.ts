import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/limits";

export const titleSchema = z.string().trim().min(1).max(120);
export const shareRoleSchema = z.enum(["viewer", "editor"]);
export const memberRoleSchema = z.enum(["owner", "editor", "viewer"]);
export const emailSchema = z.email().max(160);
export const pageSizeSchema = z.enum(["a4", "letter", "custom"]);
export const searchQuerySchema = z.string().trim().min(2).max(80);
export const displayNameSchema = z.string().trim().min(1).max(80);
export const avatarUrlSchema = z.url().max(500).optional().or(z.literal(""));
export const timeFormatSchema = z.enum(["12h", "24h"]);
export const timeZoneSchema = z.enum([
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Toronto",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
]);

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.custom<JSONContent>()).optional(),
}) satisfies z.ZodType<JSONContent>;

export const imageUploadSchema = z.object({
  type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  size: z.number().max(MAX_IMAGE_SIZE_BYTES),
});

export const textFileNameSchema = z.string().regex(/\.(txt|md)$/i);
