import type { MemberRole } from "@/lib/types";

export type Capability = "read" | "edit" | "rename" | "share" | "uploadImage" | "delete" | "transferOwnership";

const roleCapabilities: Record<MemberRole, Set<Capability>> = {
  owner: new Set(["read", "edit", "rename", "share", "uploadImage", "delete", "transferOwnership"]),
  editor: new Set(["read", "edit", "uploadImage"]),
  viewer: new Set(["read"]),
};

export function can(role: MemberRole | null | undefined, capability: Capability) {
  if (!role) return false;
  return roleCapabilities[role].has(capability);
}

export function getRoleLabel(role: MemberRole) {
  return role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer";
}
