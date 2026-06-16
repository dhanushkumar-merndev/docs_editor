import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length > 1) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
  }
  return nameOrEmail.slice(0, 2).toUpperCase()
}

export type TimeFormat = "12h" | "24h"
export type TimeZonePreference =
  | "Asia/Kolkata"
  | "America/New_York"
  | "America/Los_Angeles"
  | "America/Chicago"
  | "America/Toronto"
  | "Europe/London"
  | "Europe/Berlin"
  | "Asia/Dubai"
  | "Asia/Singapore"
  | "Asia/Tokyo"
  | "Australia/Sydney"

export function formatDate(value: string, timeFormat: TimeFormat = "12h", timeZone: TimeZonePreference = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: timeFormat === "12h",
    timeZone,
  }).format(new Date(value))
}

export function slugFromFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imported document"
}
