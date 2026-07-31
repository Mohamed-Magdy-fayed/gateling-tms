import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { likeContains } from "@/drizzle/lib/search";
import { MeetingAccountsTable } from "@/drizzle/schema";
import type { ListMeetingAccountsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Never includes `apiKey`/`apiSecret`. They are encrypted at rest, but a
 * connected onMeeting account is still a credential for someone else's system
 * — nothing outside this server module has a reason to see it, so the shape
 * the client gets can't carry it by accident.
 */
const meetingAccountListColumns = {
  id: MeetingAccountsTable.id,
  name: MeetingAccountsTable.name,
  status: MeetingAccountsTable.status,
  roomName: MeetingAccountsTable.roomName,
  roomCode: MeetingAccountsTable.roomCode,
  lastError: MeetingAccountsTable.lastError,
  createdAt: MeetingAccountsTable.createdAt,
} as const;

export type MeetingAccountListRow = {
  [K in keyof typeof meetingAccountListColumns]: (typeof MeetingAccountsTable)["$inferSelect"][K];
};

function buildWhereClause(
  ctx: OrgTRPCContext,
  input: ListMeetingAccountsInput,
) {
  const search = input.globalFilter?.trim();

  return and(
    eq(MeetingAccountsTable.organizationId, ctx.organizationId),
    isNull(MeetingAccountsTable.deletedAt),
    search ? ilike(MeetingAccountsTable.name, likeContains(search)) : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as groups'/trainees' queries.ts (STATE.md D35).
function sortExpr(input: ListMeetingAccountsInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) {
    return [desc(MeetingAccountsTable.createdAt), asc(MeetingAccountsTable.id)];
  }

  switch (firstSort.id) {
    case "name":
      return [
        firstSort.desc
          ? desc(MeetingAccountsTable.name)
          : asc(MeetingAccountsTable.name),
        asc(MeetingAccountsTable.id),
      ];
    case "status":
      return [
        firstSort.desc
          ? desc(MeetingAccountsTable.status)
          : asc(MeetingAccountsTable.status),
        asc(MeetingAccountsTable.id),
      ];
    default:
      return [
        firstSort.desc
          ? desc(MeetingAccountsTable.createdAt)
          : asc(MeetingAccountsTable.createdAt),
        asc(MeetingAccountsTable.id),
      ];
  }
}

export async function listMeetingAccounts(
  ctx: OrgTRPCContext,
  input: ListMeetingAccountsInput,
) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(MeetingAccountsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select(meetingAccountListColumns)
    .from(MeetingAccountsTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

export async function getMeetingAccount(ctx: OrgTRPCContext, id: string) {
  const [meetingAccount] = await ctx.db
    .select(meetingAccountListColumns)
    .from(MeetingAccountsTable)
    .where(
      and(
        eq(MeetingAccountsTable.id, id),
        eq(MeetingAccountsTable.organizationId, ctx.organizationId),
        isNull(MeetingAccountsTable.deletedAt),
      ),
    );

  if (!meetingAccount) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return meetingAccount;
}
