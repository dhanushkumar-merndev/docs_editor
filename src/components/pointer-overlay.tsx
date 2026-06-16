"use client";

import type { RemotePointer } from "@/hooks/use-realtime-pointer";

export function PointerOverlay({ pointers }: { pointers: Map<string, RemotePointer> }) {
  if (pointers.size === 0) return null;

  return (
    <>
      {Array.from(pointers.values()).map((ptr) => (
        <div
          key={ptr.userId}
          className="pointer-events-none absolute"
          style={{ left: ptr.x, top: ptr.y }}
        >
          <svg width="16" height="20" viewBox="0 0 16 20" className="drop-shadow-md">
            <path d="M2 0L14 12H9L11 18L5 14L0 16L2 0Z" fill={ptr.color} />
          </svg>
          <div
            className="absolute left-4 top-0 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: ptr.color }}
          >
            {ptr.name}
          </div>
          {ptr.editing ? (
            <div className="absolute -left-0.5 top-4">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-white shadow-sm" style={{ backgroundColor: ptr.color }} />
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
