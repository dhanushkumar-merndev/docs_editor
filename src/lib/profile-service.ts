import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { documentActivity, userProfiles } from "@/db/schema";
import type { CurrentUser } from "@/lib/session";
import type { TimeFormat, TimeZonePreference } from "@/lib/utils";

export type UserProfile = {
  displayName: string;
  timeFormat: TimeFormat;
  timeZone: TimeZonePreference;
};

function normalizeTimeFormat(value: string | null | undefined): TimeFormat {
  return value === "24h" ? "24h" : "12h";
}

function normalizeTimeZone(value: string | null | undefined): TimeZonePreference {
  const allowed: TimeZonePreference[] = [
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
  ];
  return allowed.includes(value as TimeZonePreference) ? (value as TimeZonePreference) : "Asia/Kolkata";
}

export async function getUserProfile(actor: CurrentUser): Promise<UserProfile> {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, actor.id)).limit(1);
  return {
    displayName: profile?.displayName || actor.name || actor.email,
    timeFormat: normalizeTimeFormat(profile?.timeFormat),
    timeZone: normalizeTimeZone(profile?.timeZone),
  };
}

export async function updateUserProfile(actor: CurrentUser, profile: UserProfile) {
  await db
    .insert(userProfiles)
    .values({
      userId: actor.id,
      displayName: profile.displayName,
      timeFormat: profile.timeFormat,
      timeZone: profile.timeZone,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        displayName: profile.displayName,
        timeFormat: profile.timeFormat,
        timeZone: profile.timeZone,
        updatedAt: new Date(),
      },
    });

  await db.insert(documentActivity).values({
    documentId: null,
    actorId: actor.id,
    actorEmail: actor.email,
    action: "profile.updated",
    metadata: { timeFormat: profile.timeFormat, timeZone: profile.timeZone },
  });

  return { ok: true, error: null };
}
