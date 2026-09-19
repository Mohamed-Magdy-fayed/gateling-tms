"use client";

import { PencilLineIcon } from "lucide-react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "@/features/core/i18n/client";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { cn } from "@/lib/utils";
import { minutesToPx, type Placement } from "./geometry";
import { groupColor } from "./group-colors";

type PointerHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
};

type SessionBlockProps = {
  session: SessionRow;
  placement: Placement;
  /** Column within its overlap cluster, and how many the cluster has. */
  lane: number;
  lanes: number;
  /** The formatted "18:00 – 20:00" for the placement being shown. */
  timeLabel: string;
  /** Whether this is the block being dragged right now. */
  isDragging: boolean;
  /** Saved optimistically, waiting for the server to agree. */
  isPending: boolean;
  /** Staff on a still-scheduled class: drag to move, drag the edge to resize. */
  editable: boolean;
  blockHandlers: PointerHandlers | null;
  resizeHandlers: PointerHandlers | null;
  onOpen: () => void;
};

/** Below this the block only has room for the group name. */
const COMPACT_HEIGHT_PX = 34;

/**
 * One class on the grid. Colour says which group (group-colors.ts); the
 * inline-start bar is solid so a block stays identifiable even when it is
 * squeezed into a third of a column by two overlapping classes.
 *
 * It is a `<button>` so the keyboard can open it; the pointer path opens it
 * from the drag hook instead (a press that never moved), so the click handler
 * only acts on keyboard-originated clicks — `detail === 0` — to avoid
 * opening twice.
 */
export function SessionBlock({
  session,
  placement,
  lane,
  lanes,
  timeLabel,
  isDragging,
  isPending,
  editable,
  blockHandlers,
  resizeHandlers,
  onOpen,
}: SessionBlockProps) {
  const { t } = useTranslation();
  const color = groupColor(session.groupId);
  const heightPx = minutesToPx(placement.durationMinutes);
  const compact = heightPx < COMPACT_HEIGHT_PX;
  const width = 100 / lanes;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) onOpen();
  };

  return (
    <button
      type="button"
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-md border-s-4 px-1.5 py-0.5 text-start text-xs leading-tight shadow-xs outline-hidden transition-[box-shadow,opacity] focus-visible:ring-2 focus-visible:ring-ring",
        color.block,
        editable
          ? "cursor-grab touch-none active:cursor-grabbing"
          : "cursor-pointer",
        session.status === "cancelled" && "opacity-50 line-through",
        session.status === "completed" && "opacity-70",
        session.status === "ongoing" && "ring-2 ring-primary",
        isDragging && "z-20 cursor-grabbing shadow-lg ring-2 ring-primary/60",
        isPending && !isDragging && "opacity-70",
      )}
      style={{
        top: minutesToPx(placement.start),
        height: Math.max(heightPx - 2, minutesToPx(15) - 2),
        insetInlineStart: `calc(${lane * width}% + 2px)`,
        width: `calc(${width}% - 4px)`,
      }}
      title={`${session.groupName} · ${timeLabel}${
        session.teacherName ? ` · ${session.teacherName}` : ""
      }`}
      aria-label={`${session.groupName}, ${timeLabel}`}
      onClick={handleClick}
      {...(blockHandlers ?? {})}
    >
      <span className="flex items-center gap-1 font-semibold">
        <span className="truncate">{session.groupName}</span>
        {session.isAdjusted ? (
          <PencilLineIcon
            className="size-3 shrink-0 opacity-70"
            aria-label={t("sessions.calendar.adjusted")}
          />
        ) : null}
      </span>
      {!compact ? (
        <span className="truncate opacity-80">{timeLabel}</span>
      ) : null}
      {!compact &&
      heightPx >= COMPACT_HEIGHT_PX * 1.6 &&
      session.teacherName ? (
        <span className="truncate opacity-70">{session.teacherName}</span>
      ) : null}

      {editable && resizeHandlers ? (
        // A grab strip along the bottom edge. Not a button of its own — it is
        // a pointer affordance inside one, and the keyboard edits length
        // through the dialog instead.
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize touch-none"
          {...resizeHandlers}
        />
      ) : null}
    </button>
  );
}
