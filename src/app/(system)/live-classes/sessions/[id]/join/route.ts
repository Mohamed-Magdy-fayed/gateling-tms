import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  buildSessionsUrl,
  SESSIONS_PATH,
  type SessionJoinResultCode,
} from "@/features/system/live-classes/sessions/lib/join-result";
import { SessionMeetingError } from "@/features/system/live-classes/sessions/server/meetings";
import { api } from "@/integrations/trpc/server";

const paramsSchema = z.object({ id: z.uuid() });

/**
 * Sends the signed-in member into a class's Gateling Meetings room.
 *
 * A route handler rather than a client-side `window.open` because the link
 * it hands out is minted per click and expires within minutes: a plain
 * `<a href>` in the agenda hits this, the server asks Meetings for a fresh
 * signed `/sso/join` URL for *this* member (host or participant is decided
 * there, never by the browser), and the response is a redirect straight into
 * the room. No second login, nothing to copy, nothing stale to store.
 *
 * Everything a tRPC call would enforce is applied because it *is* one — the
 * server-side caller runs `sessions.joinLink` with the request's own cookies,
 * so membership, the student-only-own-classes rule and the host rule live in
 * one place. Failures come back as a fixed result code on the agenda URL,
 * never as text (STATE.md D47).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    redirect(buildSessionsUrl("notFound"));
  }

  // Resolved outside the try: `redirect()` throws to do its work, and a catch
  // around it would swallow the very navigation it exists to perform.
  const destination = await resolveDestination(parsed.data.id);
  redirect(destination);
}

async function resolveDestination(sessionId: string): Promise<string> {
  try {
    const caller = await api();
    const { url } = await caller.sessions.joinLink({ id: sessionId });
    return url;
  } catch (error) {
    const code = toResultCode(error);
    return code ? buildSessionsUrl(code) : SESSIONS_PATH;
  }
}

/**
 * Null for the two failures that aren't about this class at all — no session,
 * or no active organization. `proxy.ts` already keeps signed-out visitors
 * off `/live-classes`, and the system layout handles a missing organization,
 * so those simply land on the agenda and let the app's own guards take over.
 */
function toResultCode(error: unknown): SessionJoinResultCode | null {
  if (error instanceof SessionMeetingError) return error.reason;
  if (error instanceof TRPCError) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return null;
    }
    if (error.code === "NOT_FOUND") return "notFound";
    if (error.code === "TOO_MANY_REQUESTS") return "busy";
  }
  return "unavailable";
}
