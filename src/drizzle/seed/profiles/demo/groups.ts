import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  type Group,
  type GroupScheduleSlot,
  GroupsTable,
  type Session,
  SessionsTable,
  ZoomClientsTable,
} from "@/drizzle/schema";
import { generateSessionOccurrences } from "@/features/system/learning-flow/groups/server/schedule";
import { seedIfMissing } from "../../base";
import { SEED_SYSTEM_ACTOR } from "../../constants";

/**
 * A connected-looking Zoom account for the demo org, entirely fixture data —
 * no real Zoom credentials exist for dev/CI, and nothing in this profile ever
 * calls the real Zoom API. `accessToken`/`refreshToken` are plainly-fake
 * placeholder strings, not ciphertext: nothing reads them back through
 * `decryptToken`, since the sessions this connects get their join links
 * written directly below rather than provisioned through the real
 * create-meeting flow.
 */
export async function seedDemoZoomClientFixture(organizationId: string) {
  return seedIfMissing({
    label: `fixture Zoom client for org ${organizationId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(ZoomClientsTable)
        .where(
          and(
            eq(ZoomClientsTable.organizationId, organizationId),
            eq(ZoomClientsTable.name, "Demo Academy Zoom (fixture)"),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(ZoomClientsTable)
        .values({
          organizationId,
          name: "Demo Academy Zoom (fixture)",
          status: "active",
          zoomUserId: "fixture-zoom-user",
          zoomAccountId: "fixture-zoom-account",
          zoomEmail: "zoom-demo@gateling-tms.dev",
          accessToken: "fixture:not-a-real-token",
          refreshToken: "fixture:not-a-real-token",
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
 * When `zoomFixture` is set, every generated session is written with
 * plausible meeting fields already attached — fixture data, not a real
 * Zoom-provisioned meeting (see `seedDemoZoomClientFixture`).
 */
export async function seedDemoSessionsForGroup(input: {
  organizationId: string;
  group: Group;
  timeZone: string;
  zoomFixture?: { zoomClientId: string };
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
            ...(input.zoomFixture
              ? {
                  zoomClientId: input.zoomFixture.zoomClientId,
                  zoomMeetingId: `${8000000000 + index}`,
                  zoomMeetingPassword: "demo123",
                  zoomJoinUrl: `https://zoom.us/j/${8000000000 + index}?pwd=fixture`,
                  zoomStartUrl: `https://zoom.us/s/${8000000000 + index}?zak=fixture`,
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
