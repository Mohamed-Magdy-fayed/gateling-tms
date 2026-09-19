import type { SessionStatus } from "@/drizzle/schema";

/**
 * Whether a class may still be moved around on the calendar. Only a class
 * that hasn't happened yet: an ongoing one has a room open, and a completed
 * or cancelled one is a record of what happened, which dragging a block
 * must not rewrite.
 *
 * In `lib/` because both sides ask: the server before it writes, the week
 * view before it offers a drag handle at all.
 */
export function isSessionEditable(status: SessionStatus): boolean {
  return status === "scheduled";
}
