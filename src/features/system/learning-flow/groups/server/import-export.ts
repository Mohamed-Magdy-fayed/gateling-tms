import { and, asc, eq, isNull } from "drizzle-orm";
import {
  GroupStudentsTable,
  GroupsTable,
  TraineesTable,
} from "@/drizzle/schema";
import type { ExportRowLoader } from "@/features/core/import/server/export-registry";

/**
 * Who sits in which class, in the shape the group-assignments template
 * accepts. There is no id column to carry — re-importing the file is a no-op
 * because the insert ignores a membership that already exists.
 */
export const loadGroupStudentExportRows: ExportRowLoader = async (
  db,
  organizationId,
) => {
  const memberships = await db
    .select({
      groupName: GroupsTable.name,
      traineeEmail: TraineesTable.email,
      traineeName: TraineesTable.name,
    })
    .from(GroupStudentsTable)
    .innerJoin(GroupsTable, eq(GroupStudentsTable.groupId, GroupsTable.id))
    .innerJoin(
      TraineesTable,
      and(
        eq(GroupStudentsTable.traineeId, TraineesTable.id),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .where(eq(GroupStudentsTable.organizationId, organizationId))
    .orderBy(
      asc(GroupsTable.name),
      asc(TraineesTable.name),
      asc(GroupStudentsTable.traineeId),
    );

  return memberships.map((membership) => ({
    groupName: membership.groupName,
    traineeEmail: membership.traineeEmail ?? "",
    traineeName: membership.traineeName,
  }));
};
