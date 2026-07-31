import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  type Group,
  type GroupScheduleSlot,
  GroupsTable,
  MeetingAccountsTable,
  type Session,
  SessionsTable,
} from "@/drizzle/schema";
import { generateSessionOccurrences } from "@/features/system/learning-flow/groups/server/schedule";
import { seedIfMissing } from "../../base";
import { SEED_SYSTEM_ACTOR } from "../../constants";

/**
 * A connected-looking onMeeting room for the demo org, entirely fixture data —
 * no real onMeeting credentials exist for dev/CI, and nothing in this profile
 * ever calls the real onMeeting API. `apiKey`/`apiSecret` are plainly-fake
 * placeholder strings, not ciphertext: nothing reads them back through
 * `decryptToken`, since the sessions this connects get their join links
 * written directly below rather than provisioned through the real
 * create-meeting flow.
 */
export async function seedDemoMeetingAccountFixture(organizationId: string) {
  return seedIfMissing({
    label: `fixture onMeeting room for org ${organizationId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(MeetingAccountsTable)
        .where(
          and(
            eq(MeetingAccountsTable.organizationId, organizationId),
            eq(MeetingAccountsTable.name, "Demo Academy — Main room (fixture)"),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(MeetingAccountsTable)
        .values({
          organizationId,
          name: "Demo Academy — Main room (fixture)",
          status: "active",
          accountId: "fixture-onmeeting-account",
          roomCode: "FIXTURE-ROOM-1",
          roomName: "Main room",
          apiKey: "fixture:not-a-real-key",
          apiSecret: "fixture:not-a-real-secret",
          createdBy: SEED_SYSTEM_ACTOR,
        })
        .returning();
      return row;
    },
  });
}

export async function seedDemoGroup(input: {
  organizationId: string;
  name: string;
  courseId: string | null;
  teacherId: string | null;
  schedule: GroupScheduleSlot[];
  startDate: string;
  sessionCount: number;
}): Promise<Group> {
  return seedIfMissing({
    label: `group "${input.name}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(GroupsTable)
        .where(
          and(
            eq(GroupsTable.organizationId, input.organizationId),
            eq(GroupsTable.name, input.name),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(GroupsTable)
        .values({
          organizationId: input.organizationId,
          name: input.name,
          courseId: input.courseId,
          teacherId: input.teacherId,
          schedule: input.schedule,
          startDate: input.startDate,
          sessionCount: input.sessionCount,
        })
        .returning();
      return row;
    },
  });
}

/**
 * Expands the group's schedule into sessions (reusing the same pure expander
 * the real `group/schedule-changed` Inngest function uses) and inserts them.
 * When `meetingFixture` is set, every generated session is written as if it
 * had already been started — fixture data, not a real onMeeting-provisioned
 * meeting (see `seedDemoMeetingAccountFixture`). Real sessions get these
 * fields only when a host presses "Start class" (STATE.md D143); the demo
 * needs at least one already-started class to show that state.
 */
export async function seedDemoSessionsForGroup(input: {
  organizationId: string;
  group: Group;
  timeZone: string;
  meetingFixture?: { meetingAccountId: string };
}): Promise<Session[]> {
  const occurrences = generateSessionOccurrences({
    schedule: input.group.schedule,
    startDate: input.group.startDate,
    sessionCount: input.group.sessionCount,
    timeZone: input.timeZone,
  });

  const sessions: Session[] = [];
  for (const [index, occurrence] of occurrences.entries()) {
    const session = await seedIfMissing({
      label: `session #${index + 1} of group "${input.group.name}"`,
      find: async () => {
        const [row] = await db
          .select()
          .from(SessionsTable)
          .where(
            and(
              eq(SessionsTable.groupId, input.group.id),
              eq(SessionsTable.scheduledAt, occurrence.scheduledAt),
            ),
          )
          .limit(1);
        return row;
      },
      insert: async () => {
        const [row] = await db
          .insert(SessionsTable)
          .values({
            organizationId: input.organizationId,
            groupId: input.group.id,
            scheduledAt: occurrence.scheduledAt,
            durationMinutes: occurrence.durationMinutes,
            teacherId: input.group.teacherId,
            ...(input.meetingFixture
              ? {
                  meetingAccountId: input.meetingFixture.meetingAccountId,
                  meetingNumber: `${8000000000 + index}`,
                  joinUrl: `https://onmeeting.co/j/${8000000000 + index}`,
                  startUrl: `https://onmeeting.co/s/${8000000000 + index}?zak=fixture`,
                }
              : {}),
          })
          .returning();
        return row;
      },
    });
    sessions.push(session);
  }

  return sessions;
}
