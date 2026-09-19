import { and, asc, eq } from "drizzle-orm";
import { TeacherAvailabilityTable, UsersTable } from "@/drizzle/schema";
import type { AvailabilitySlot } from "../lib/slots";
import type { ListTeacherAvailabilityInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

export type TeacherAvailabilityRow = AvailabilitySlot & {
  id: string;
  teacherId: string;
  teacherName: string | null;
};

/**
 * A teacher's weekly windows — or everyone's, when no teacher is given. The
 * week view asks for one teacher at a time (it shades that person's windows
 * behind the grid); the all-teachers form is there for a "who is free on
 * Monday evening?" view and costs nothing extra.
 */
export async function listTeacherAvailability(
  ctx: OrgTRPCContext,
  input: ListTeacherAvailabilityInput,
): Promise<TeacherAvailabilityRow[]> {
  return ctx.db
    .select({
      id: TeacherAvailabilityTable.id,
      teacherId: TeacherAvailabilityTable.teacherId,
      teacherName: UsersTable.name,
      day: TeacherAvailabilityTable.day,
      startTime: TeacherAvailabilityTable.startTime,
      endTime: TeacherAvailabilityTable.endTime,
    })
    .from(TeacherAvailabilityTable)
    .leftJoin(UsersTable, eq(UsersTable.id, TeacherAvailabilityTable.teacherId))
    .where(
      and(
        eq(TeacherAvailabilityTable.organizationId, ctx.organizationId),
        input.teacherId
          ? eq(TeacherAvailabilityTable.teacherId, input.teacherId)
          : undefined,
      ),
    )
    .orderBy(
      asc(TeacherAvailabilityTable.teacherId),
      asc(TeacherAvailabilityTable.day),
      asc(TeacherAvailabilityTable.startTime),
    );
}
