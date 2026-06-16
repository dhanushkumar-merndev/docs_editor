import { NextResponse } from "next/server";
import { getUserProfile, updateUserProfile } from "@/lib/profile-service";
import { requireCurrentUser } from "@/lib/session";
import { displayNameSchema, timeFormatSchema, timeZoneSchema } from "@/lib/validation";

export async function GET() {
  const actor = await requireCurrentUser();
  return NextResponse.json({ profile: await getUserProfile(actor) });
}

export async function PATCH(request: Request) {
  const actor = await requireCurrentUser();
  const body = (await request.json()) as { displayName?: string; timeFormat?: string; timeZone?: string };
  const parsedDisplayName = displayNameSchema.safeParse(body.displayName);
  const parsedTimeFormat = timeFormatSchema.safeParse(body.timeFormat);
  const parsedTimeZone = timeZoneSchema.safeParse(body.timeZone);

  if (!parsedDisplayName.success || !parsedTimeFormat.success || !parsedTimeZone.success) {
    return NextResponse.json({ error: "Invalid profile details" }, { status: 400 });
  }

  const result = await updateUserProfile(actor, {
    displayName: parsedDisplayName.data,
    timeFormat: parsedTimeFormat.data,
    timeZone: parsedTimeZone.data,
  });
  return NextResponse.json(result);
}
