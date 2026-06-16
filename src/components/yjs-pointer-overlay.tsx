"use client";

import type { Awareness } from "y-protocols/awareness";

// Displays named blinking carets from Yjs Awareness state inside the editor canvas.
export type YjsAwarenessState = {
  user?: {
    userId: string;
    name: string;
    color: string;
  };
  cursor?: {
    x: number;
    y: number;
  };
};

export function YjsPointerOverlay({ awareness, localUserId }: { awareness: Awareness | null; localUserId: string }) {
  if (!awareness) return null;
  const states = Array.from(awareness.getStates().values()) as YjsAwarenessState[];
  const remoteStates = states.filter((state) => state.user?.userId && state.user.userId !== localUserId && state.cursor);
  if (remoteStates.length === 0) return null;

  return (
    <>
      {remoteStates.map((state) => (
        <div
          key={state.user!.userId}
          className="pointer-events-none absolute"
          style={{ left: state.cursor!.x, top: state.cursor!.y }}
        >
          <div
            className="remote-caret absolute -left-px top-0 h-6 w-0.5 rounded-sm"
            style={{ backgroundColor: state.user!.color }}
          />
          <div
            className="absolute -left-0.5 -top-5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
            style={{ backgroundColor: state.user!.color }}
          >
            {state.user!.name}
          </div>
        </div>
      ))}
    </>
  );
}
