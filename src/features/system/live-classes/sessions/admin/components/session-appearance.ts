import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { cn } from "@/lib/utils";
import { type GroupColor, groupColor } from "./week-calendar/group-colors";

/**
 * How a class looks on any calendar, in one place: its group's colour and
 * what its status does to it. The week grid's blocks and the month grid's
 * chips both read this, so a new session attribute (a substitute teacher, a
 * room) lands once instead of drifting between two renderers.
 */
export function sessionAppearance(
  session: Pick<SessionRow, "groupId" | "status">,
): { color: GroupColor; statusClassName: string } {
  return {
    color: groupColor(session.groupId),
    statusClassName: cn(
      session.status === "cancelled" && "opacity-50 line-through",
      session.status === "completed" && "opacity-70",
      session.status === "ongoing" && "ring-2 ring-primary",
    ),
  };
}
