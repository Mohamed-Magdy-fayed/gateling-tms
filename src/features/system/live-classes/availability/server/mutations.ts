import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  OrganizationMembershipsTable,
  TeacherAvailabilityTable,
} from "@/drizzle/schema";
import { normalizeAvailability } from "../lib/slots";
import type { SetTeacherAvailabilityInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Who may edit whose availability. An admin schedules everyone, so they may
 * set anyone's; a teacher knows their own week better than anyone, so they
 * may set their own — and only their own, because a teacher quietly marking
 * a colleague "unavailable" is a scheduling dispute, not a data entry.
 */
export function canSetAvailability(
  viewer: { userId: string; role: OrgTRPCContext["role"] },
  teacherId: string,
): boolean {
  if (viewer.role === "admin") return true;
  return viewer.role === "teacher" && viewer.userId === teacherId;
}

/**
 * Replaces one teacher's weekly windows with the given set, normalized —
 * merged, snapped, sorted — so what is stored is always the canonical form
 * the calendar paints from (lib/slots.ts).
 */
export async function setTeacherAvailability(
  ctx: OrgTRPCContext,
  input: SetTeacherAvailabilityInput,
) {
  const viewer = { userId: ctx.session.user.id, role: ctx.role };
  if (!canSetAvailability(viewer, input.teacherId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("sessions.availability.errors.forbidden"),
    });
  }

  // Availability belongs to a member who can teach. A student has no classes
  // to be free for, and a user outside the org is not a teacher here at all;
  // both read as "no such teacher" rather than leaking which it was.
  const membership = await ctx.db.query.OrganizationMembershipsTable.findFirst({
    where: and(
      eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
      eq(OrganizationMembershipsTable.userId, input.teacherId),
    ),
    columns: { role: true },
  });
  if (!membership || membership.role === "student") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("groups.teacherNotFound"),
    });
  }

  const slots = normalizeAvailability(input.slots);

  await ctx.db.transaction(async (trx) => {
    await trx
      .delete(TeacherAvailabilityTable)
      .where(
        and(
          eq(TeacherAvailabilityTable.organizationId, ctx.organizationId),
          eq(TeacherAvailabilityTable.teacherId, input.teacherId),
        ),
      );

    if (slots.length === 0) return;

    await trx.insert(TeacherAvailabilityTable).values(
      slots.map((slot) => ({
        organizationId: ctx.organizationId,
        teacherId: input.teacherId,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    );
  });

  return { slots };
}
