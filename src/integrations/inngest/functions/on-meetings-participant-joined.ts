import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import { matchParticipantToTrainee } from "@/features/system/live-classes/attendance/lib/meeting-attendance";
import {
  findSessionForMeeting,
  listRosterCandidates,
  recordMeetingJoin,
} from "@/features/system/live-classes/attendance/server/meeting-sync";
import { parseSessionExternalRef } from "@/features/system/live-classes/sessions/lib/meeting-ref";
import { inngest } from "../client";

/**
 * Someone other than the host connected to a class's room, forwarded by
 * `app/api/meetings-webhook/route.ts`. The delivery id is the Inngest event
 * id, so Meetings' retries never record the same join twice.
 */
export const meetingsParticipantJoinedEvent = eventType(
  "meetings/participant.joined",
  {
    schema: z.object({
      deliveryId: z.string(),
      meeting: z.object({
        code: z.string(),
        externalRef: z.string().nullable(),
      }),
      participant: z.object({ name: z.string() }),
      at: z.string(),
    }),
  },
);

/**
 * Marks a student present the moment they join — but only when the name
 * they joined under names exactly one trainee on the class's roster. An
 * unmatched join changes nothing; the teacher marks that student by hand.
 * How late they were is taken from the join against the scheduled start.
 *
 * Minutes in the room are not counted here: they are settled from the full
 * participant log when the room closes (`on-meetings-webhook`).
 */
export const onMeetingsParticipantJoined = inngest.createFunction(
  {
    id: "on-meetings-participant-joined",
    triggers: [meetingsParticipantJoinedEvent],
  },
  async ({ event, step }) => {
    const { meeting, participant, at } = event.data;
    const sessionId = parseSessionExternalRef(meeting.externalRef);
    if (!sessionId) return { outcome: "not-a-session" as const };

    return step.run("record-join", async () => {
      const session = await findSessionForMeeting(db, sessionId, meeting.code);
      if (!session) return { outcome: "no-session" as const };

      const roster = await listRosterCandidates(db, session);
      const traineeId = matchParticipantToTrainee(participant.name, roster);
      if (!traineeId) return { outcome: "unmatched" as const, sessionId };

      await recordMeetingJoin(db, session, traineeId, new Date(at));
      return { outcome: "recorded" as const, sessionId, traineeId };
    });
  },
);
