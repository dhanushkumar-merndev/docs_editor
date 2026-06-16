import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { updateMemberRoleForOwner, removeMemberForOwner } from "@/lib/document-service";
import type { MemberRole } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = await params;
  const { userId, role } = (await req.json()) as { userId: string; role: MemberRole };
  if (!userId || !role) return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
  if (role === "owner") return NextResponse.json({ error: "Use transfer ownership instead" }, { status: 400 });
  const result = await updateMemberRoleForOwner(documentId, user, userId, role);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = await params;
  const { userId } = (await req.json()) as { userId: string };
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const result = await removeMemberForOwner(documentId, user, userId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
