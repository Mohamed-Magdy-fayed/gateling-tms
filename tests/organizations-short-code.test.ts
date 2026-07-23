import { describe, expect, test } from "vitest";
import { generateUniqueOrganizationShortCode } from "../src/features/core/organizations/server/short-code";

// biome-ignore lint/suspicious/noExplicitAny: minimal structural fake of the drizzle client's `.query` surface — `generateUniqueOrganizationShortCode` only ever calls `.query.OrganizationsTable.findFirst`
type FakeDb = any;

function dbWithNoCollisions(): FakeDb {
  return {
    query: {
      OrganizationsTable: {
        findFirst: async () => undefined,
      },
    },
  };
}

describe("generateUniqueOrganizationShortCode", () => {
  test("produces an 8-character uppercase alphanumeric code", async () => {
    const code = await generateUniqueOrganizationShortCode(
      dbWithNoCollisions(),
      "Cairo Coding Academy",
    );

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  test("derives the prefix from the organization name", async () => {
    // Code = 4-char name-derived prefix + 4-char random hex suffix.
    const code = await generateUniqueOrganizationShortCode(
      dbWithNoCollisions(),
      "Nile Academy",
    );

    expect(code.startsWith("NILE")).toBe(true);
  });

  test("falls back to a generic prefix when the name has no letters/digits", async () => {
    const code = await generateUniqueOrganizationShortCode(
      dbWithNoCollisions(),
      "٠١٢ ---",
    );

    expect(code.startsWith("ORG")).toBe(true);
  });

  test("retries on collision until it finds a free code", async () => {
    let calls = 0;
    const db: FakeDb = {
      query: {
        OrganizationsTable: {
          findFirst: async () => {
            calls += 1;
            // Collide on the first two attempts, then succeed.
            return calls <= 2 ? { id: "taken" } : undefined;
          },
        },
      },
    };

    const code = await generateUniqueOrganizationShortCode(db, "Retry Academy");

    expect(calls).toBe(3);
    expect(code).toHaveLength(8);
  });

  test("throws after exhausting all attempts against permanent collisions", async () => {
    const db: FakeDb = {
      query: {
        OrganizationsTable: {
          findFirst: async () => ({ id: "always-taken" }),
        },
      },
    };

    await expect(
      generateUniqueOrganizationShortCode(db, "Collision Academy"),
    ).rejects.toThrow();
  });
});
