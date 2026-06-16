"use client";

import type { RemotePointer } from "@/hooks/use-realtime-pointer";

export function PointerOverlay({ pointers, containerRef }: { pointers: Map<string, RemotePointer>; containerRef: React.RefObject<HTMLDivElement | null> }) {
  if (pointers.size === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {Array.from(pointers.values()).map((ptr) => (
        <div
          key={ptr.userId}
          className="absolute transition-[left,top] duration-75 ease-linear"
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
        </div>
      ))}
    </div>
  );
}
