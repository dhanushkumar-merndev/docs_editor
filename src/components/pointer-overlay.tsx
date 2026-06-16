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
          <div
            className="absolute -left-px h-5 w-0.5 animate-pulse rounded-sm"
            style={{ backgroundColor: ptr.color }}
          />
          <div
            className="absolute -left-0.5 -top-5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
            style={{ backgroundColor: ptr.color }}
          >
            {ptr.name}
          </div>
          {ptr.editing ? (
            <div
              className="absolute -left-0.5 top-5 size-1.5 animate-ping rounded-full shadow-sm"
              style={{ backgroundColor: ptr.color }}
            />
          ) : null}
        </div>
      ))}
    </>
  );
}
