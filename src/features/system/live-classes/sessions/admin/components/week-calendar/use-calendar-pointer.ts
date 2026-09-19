"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  MINUTES_PER_DAY,
  roundToSlot,
  snapToSlot,
} from "@/features/system/live-classes/sessions/lib/week";
import {
  clampPlacement,
  DRAG_THRESHOLD_PX,
  dayIndexAtPointer,
  minutesAtPointer,
  type Placement,
  pxToMinutes,
  samePlacement,
} from "./geometry";

export type DragKind = "move" | "resize";

export type ActiveDrag = {
  kind: DragKind;
  sessionId: string;
  origin: Placement;
  current: Placement;
};

type DragInternal = ActiveDrag & {
  pointerId: number;
  startX: number;
  startY: number;
  /** Past the threshold — a release is a drop, not a click. */
  moved: boolean;
};

type PointerHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
};

/**
 * Drag-to-move and drag-to-resize for session blocks.
 *
 * Pointer events with capture rather than the HTML drag-and-drop API: DnD
 * gives no control over the ghost image, no per-pixel position, and no
 * touch support worth having, and the whole feature is "the block follows
 * the pointer and snaps as it goes". A press that never travels past the
 * threshold is a click, which is how the block also opens its dialog
 * without needing a second hit target.
 *
 * `onCommit` fires once per drop with the new placement; the caller decides
 * what to persist and how to show the block meanwhile (`active` carries the
 * in-flight placement for rendering).
 */
export function useSessionDrag({
  gridRef,
  onCommit,
  onClick,
}: {
  gridRef: RefObject<HTMLElement | null>;
  onCommit: (
    sessionId: string,
    placement: Placement,
    origin: Placement,
  ) => void;
  onClick: (sessionId: string) => void;
}) {
  const [active, setActive] = useState<ActiveDrag | null>(null);
  const activeRef = useRef<DragInternal | null>(null);

  const publish = useCallback((drag: DragInternal | null) => {
    activeRef.current = drag;
    setActive(
      drag
        ? {
            kind: drag.kind,
            sessionId: drag.sessionId,
            origin: drag.origin,
            current: drag.current,
          }
        : null,
    );
  }, []);

  const begin = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      kind: DragKind,
      sessionId: string,
      origin: Placement,
    ) => {
      // Primary button only — a right-click is the context menu, a middle
      // click is the browser's.
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      publish({
        kind,
        sessionId,
        origin,
        current: origin,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      });
    },
    [publish],
  );

  const move = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = activeRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const moved =
        drag.moved ||
        Math.abs(dx) > DRAG_THRESHOLD_PX ||
        Math.abs(dy) > DRAG_THRESHOLD_PX;
      if (!moved) return;

      const deltaMinutes = roundToSlot(pxToMinutes(dy));
      const grid = gridRef.current;

      const current: Placement =
        drag.kind === "move"
          ? clampPlacement({
              dayIndex: grid
                ? dayIndexAtPointer(grid, event.clientX)
                : drag.origin.dayIndex,
              start: drag.origin.start + deltaMinutes,
              durationMinutes: drag.origin.durationMinutes,
            })
          : clampPlacement({
              dayIndex: drag.origin.dayIndex,
              start: drag.origin.start,
              durationMinutes: Math.min(
                drag.origin.durationMinutes + deltaMinutes,
                MINUTES_PER_DAY - drag.origin.start,
              ),
            });

      if (!samePlacement(current, drag.current) || moved !== drag.moved) {
        publish({ ...drag, current, moved });
      }
    },
    [gridRef, publish],
  );

  const end = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = activeRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      publish(null);

      if (!drag.moved) {
        onClick(drag.sessionId);
        return;
      }
      if (!samePlacement(drag.current, drag.origin)) {
        onCommit(drag.sessionId, drag.current, drag.origin);
      }
    },
    [onClick, onCommit, publish],
  );

  const cancel = useCallback(() => publish(null), [publish]);

  const blockHandlers = useCallback(
    (sessionId: string, origin: Placement): PointerHandlers => ({
      onPointerDown: (event) => begin(event, "move", sessionId, origin),
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: cancel,
    }),
    [begin, move, end, cancel],
  );

  const resizeHandlers = useCallback(
    (sessionId: string, origin: Placement): PointerHandlers => ({
      onPointerDown: (event) => {
        // The handle sits inside the block; without this the block would
        // start its own move at the same time.
        event.stopPropagation();
        begin(event, "resize", sessionId, origin);
      },
      onPointerMove: (event) => {
        event.stopPropagation();
        move(event);
      },
      onPointerUp: (event) => {
        event.stopPropagation();
        end(event);
      },
      onPointerCancel: cancel,
    }),
    [begin, move, end, cancel],
  );

  return { active, blockHandlers, resizeHandlers };
}

export type PaintSelection = {
  dayIndex: number;
  start: number;
  end: number;
};

/**
 * Drag-on-empty-space to paint an availability window. Only the column's own
 * background starts a paint — a press on a session block is that block's
 * business — and a press that never grows into a range paints nothing.
 */
export function useAvailabilityPaint({
  enabled,
  onPaint,
}: {
  enabled: boolean;
  onPaint: (selection: PaintSelection) => void;
}) {
  const [selection, setSelection] = useState<PaintSelection | null>(null);
  const paintRef = useRef<
    (PaintSelection & { pointerId: number; anchor: number }) | null
  >(null);

  const columnHandlers = useCallback(
    (dayIndex: number): Partial<PointerHandlers> => {
      if (!enabled) return {};
      return {
        onPointerDown: (event) => {
          if (event.button !== 0 || event.target !== event.currentTarget) {
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          const anchor = snapToSlot(
            minutesAtPointer(event.currentTarget, event.clientY),
          );
          const next = {
            dayIndex,
            start: anchor,
            end: anchor,
            anchor,
            pointerId: event.pointerId,
          };
          paintRef.current = next;
          setSelection({ dayIndex, start: anchor, end: anchor });
        },
        onPointerMove: (event) => {
          const paint = paintRef.current;
          if (!paint || paint.pointerId !== event.pointerId) return;
          const at = snapToSlot(
            minutesAtPointer(event.currentTarget, event.clientY),
          );
          const next = {
            ...paint,
            start: Math.min(paint.anchor, at),
            end: Math.max(paint.anchor, at),
          };
          paintRef.current = next;
          setSelection({
            dayIndex: next.dayIndex,
            start: next.start,
            end: next.end,
          });
        },
        onPointerUp: (event) => {
          const paint = paintRef.current;
          if (!paint || paint.pointerId !== event.pointerId) return;
          paintRef.current = null;
          setSelection(null);
          if (paint.end > paint.start) {
            onPaint({
              dayIndex: paint.dayIndex,
              start: paint.start,
              end: paint.end,
            });
          }
        },
        onPointerCancel: () => {
          paintRef.current = null;
          setSelection(null);
        },
      };
    },
    [enabled, onPaint],
  );

  return { selection, columnHandlers };
}
