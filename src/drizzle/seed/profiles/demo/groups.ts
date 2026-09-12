import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  type Group,
  type GroupScheduleSlot,
  GroupsTable,
  type Session,
  SessionsTable,
} from "@/drizzle/schema";
import { generateSessionOccurrences } from "@/features/system/learning-flow/groups/server/schedule";
import { seedIfMissing } from "../../base";

/**
 * Where the fixture "already started" sessions appear to live. A host that
 * never resolves — nothing in this profile ever contacts Gateling Meetings,
 * and the seeded link only has to *look* like one in a screenshot or an e2e
 * run (docs/seeding-and-demo-data.md).
 */
const FIXTURE_MEETINGS_ORIGIN = "https://meetings.example.test";

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
 * had already been started — fixture data, not a real room on Gateling
 * Meetings. Real sessions get these fields only when a host presses "Start
 * class" (STATE.md D143); the demo needs at least one already-started class
 * to show that state. `hostUserId` is who the fixture names as host: that
 * member sees "Start class" on those rows, everyone else sees "Join".
 */
export async function seedDemoSessionsForGroup(input: {
  organizationId: string;
  group: Group;
  timeZone: string;
  meetingFixture?: { hostUserId: string };
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
                  status: "ongoing" as const,
                  meetingCode: fixtureMeetingCode(index),
                  joinUrl: `${FIXTURE_MEETINGS_ORIGIN}/m/${fixtureMeetingCode(index)}`,
                  meetingHostUserId: input.meetingFixture.hostUserId,
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

/** Meetings' `abc-defg-hij` shape, with a fixed prefix so it reads as fake. */
function fixtureMeetingCode(index: number): string {
  return `fix-demo-${String(index).padStart(3, "0")}`;
}
