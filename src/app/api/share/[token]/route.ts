import { NextResponse } from "next/server";
import { openPublicLink } from "@/lib/document-service";
import { requireCurrentUser } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const actor = await requireCurrentUser();
  const { token } = await context.params;
  const documentId = await openPublicLink(token, actor);
  if (!documentId) return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
  return NextResponse.json({ documentId });
}
