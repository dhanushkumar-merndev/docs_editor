// Provides stable collaborator colors across members, awareness carets, and presence UI.
const POINTER_COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

function hashUserId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getCollabColor(userId: string): string {
  return POINTER_COLORS[hashUserId(userId) % POINTER_COLORS.length];
}
