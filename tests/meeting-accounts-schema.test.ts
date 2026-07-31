import { describe, expect, test } from "vitest";
import { MeetingAccountsTable } from "../src/drizzle/schemas/live/meeting-accounts-table";
import {
  connectMeetingAccountSchema,
  listMeetingAccountsInput,
  renameMeetingAccountSchema,
} from "../src/features/system/live-classes/meeting-accounts/server/schemas";

describe("connectMeetingAccountSchema", () => {
  const valid = {
    name: "Main account",
    email: "admin@example.com",
    password: "whatever-they-use",
  };

  test("accepts a full sign-in", () => {
    expect(connectMeetingAccountSchema.safeParse(valid).success).toBe(true);
  });

  test("trims the display name", () => {
    const parsed = connectMeetingAccountSchema.parse({
      ...valid,
      name: "  Main account  ",
    });

    expect(parsed.name).toBe("Main account");
  });

  test("rejects a blank name, email or password", () => {
    for (const field of ["name", "email", "password"] as const) {
      expect(
        connectMeetingAccountSchema.safeParse({ ...valid, [field]: "" })
          .success,
      ).toBe(false);
    }
  });

  test("rejects an email that isn't one", () => {
    expect(
      connectMeetingAccountSchema.safeParse({ ...valid, email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  // The password belongs to onMeeting, not to this app. Imposing a length or
  // character policy here would reject accounts that work (STATE.md D146).
  test("imposes no policy on the password beyond being present", () => {
    expect(
      connectMeetingAccountSchema.safeParse({ ...valid, password: "a" })
        .success,
    ).toBe(true);
  });

  test("caps the display name so the room suffix still fits in the column", () => {
    const parsed = connectMeetingAccountSchema.safeParse({
      ...valid,
      name: "x".repeat(201),
    });

    expect(parsed.success).toBe(false);
  });
});

describe("renameMeetingAccountSchema", () => {
  test("requires a uuid and a name", () => {
    expect(
      renameMeetingAccountSchema.safeParse({
        id: "not-a-uuid",
        name: "Studio",
      }).success,
    ).toBe(false);
  });
});

describe("listMeetingAccountsInput", () => {
  test("defaults to the first page", () => {
    const parsed = listMeetingAccountsInput.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.sorting).toEqual([]);
  });

  test("refuses an unbounded page size", () => {
    expect(listMeetingAccountsInput.safeParse({ perPage: 5000 }).success).toBe(
      false,
    );
  });
});

describe("meeting_accounts table", () => {
  // The onMeeting password is exchanged for API keys and dropped. If a column
  // for it ever appears, the guarantee in D146 has quietly stopped being true.
  test("has nowhere to store a password", () => {
    const columns = Object.keys(MeetingAccountsTable);

    expect(columns).not.toContain("password");
    expect(columns.some((name) => /password/i.test(name))).toBe(false);
  });

  test("carries organizationId, like every tenant-owned table", () => {
    expect(Object.keys(MeetingAccountsTable)).toContain("organizationId");
  });

  // Reconnecting the same account has to land on the row it already has —
  // duplicates would double the org's apparent concurrent capacity. The
  // guarantee is the partial unique index the upsert conflicts against, so the
  // columns it is keyed on must both exist and be non-null.
  test("has the columns the room-identity key is built from", () => {
    const columns = Object.keys(MeetingAccountsTable);

    expect(columns).toContain("roomCode");
    expect(columns).toContain("deletedAt");
    expect(MeetingAccountsTable.roomCode.notNull).toBe(true);
    expect(MeetingAccountsTable.organizationId.notNull).toBe(true);
  });
});
