import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import {
  GroupStudentsTable,
  GroupsTable,
  TraineesTable,
} from "@/drizzle/schema";
import type { ExportRowLoader } from "@/features/core/import/server/export-registry";

/**
 * The organization's trainees in the shape its import template accepts.
 *
 * The template holds one group per trainee, so the column is filled only when
 * a trainee is in exactly one — writing an arbitrary one of several would
 * quietly drop the rest. Re-importing never removes anyone from a group, and
 * the group-assignments export carries the full picture.
 */
export const loadTraineeExportRows: ExportRowLoader = async (
  db,
  organizationId,
) => {
  const trainees = await db
    .select({
      id: TraineesTable.id,
      name: TraineesTable.name,
      phone: TraineesTable.phone,
      email: TraineesTable.email,
    })
    .from(TraineesTable)
    .where(
      and(
        eq(TraineesTable.organizationId, organizationId),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .orderBy(asc(TraineesTable.createdAt), asc(TraineesTable.id));

  const groupNamesByTrainee = new Map<string, string[]>();
  if (trainees.length > 0) {
    const memberships = await db
      .select({
        traineeId: GroupStudentsTable.traineeId,
        groupName: GroupsTable.name,
      })
      .from(GroupStudentsTable)
      .innerJoin(GroupsTable, eq(GroupStudentsTable.groupId, GroupsTable.id))
      .where(
        and(
          eq(GroupStudentsTable.organizationId, organizationId),
          inArray(
            GroupStudentsTable.traineeId,
            trainees.map((trainee) => trainee.id),
          ),
        ),
      );

    for (const membership of memberships) {
      const names = groupNamesByTrainee.get(membership.traineeId);
      if (names) names.push(membership.groupName);
      else groupNamesByTrainee.set(membership.traineeId, [membership.groupName]);
    }
  }

  return trainees.map((trainee) => {
    const groups = groupNamesByTrainee.get(trainee.id) ?? [];
    return {
      id: trainee.id,
      name: trainee.name,
      phone: trainee.phone ?? "",
      email: trainee.email ?? "",
      groupName: groups.length === 1 ? groups[0] : "",
    };
  });
};
