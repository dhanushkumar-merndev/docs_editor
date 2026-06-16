import type { DocumentSummary } from "@/lib/document-service";
import type { TimeFormat, TimeZonePreference } from "@/lib/utils";

// Defines dashboard-only types shared by the route client and its local components.
export type PendingAction =
  | { type: "delete"; doc: DocumentSummary }
  | { type: "leave"; doc: DocumentSummary }
  | null;

export type DashboardView = "my" | "shared" | "recent";

export type ProfileState = {
  displayName: string;
  timeFormat: TimeFormat;
  timeZone: TimeZonePreference;
};

export const timeZones: { value: TimeZonePreference; label: string }[] = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AET)" },
];
