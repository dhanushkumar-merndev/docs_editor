import { EditorClient } from "@/app/documents/[documentId]/editor-client";
import { getDocumentForUser } from "@/lib/document-service";
import { requireCurrentUser } from "@/lib/session";

export default async function DocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const actor = await requireCurrentUser();
  const document = await getDocumentForUser(documentId, actor);
  return <EditorClient documentId={documentId} initialDocument={document} />;
}
