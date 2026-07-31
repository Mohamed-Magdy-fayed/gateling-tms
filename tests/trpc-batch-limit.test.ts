import { describe, expect, test } from "vitest";
import {
  countBatchedProcedures,
  exceedsBatchLimit,
  MAX_TRPC_BATCH_SIZE,
} from "../src/integrations/trpc/batch-limit";

const origin = "https://tms.gateling.com";

function batchUrl(procedures: string[]) {
  return `${origin}/api/trpc/${procedures.join(",")}?batch=1`;
}

describe("countBatchedProcedures", () => {
  test("counts a single, non-batched call as one", () => {
    expect(countBatchedProcedures(`${origin}/api/trpc/courses.list`)).toBe(1);
  });

  test("counts every procedure in a batched path", () => {
    expect(
      countBatchedProcedures(
        batchUrl(["courses.list", "trainees.list", "groups.list"]),
      ),
    ).toBe(3);
  });

  // Padding a batch with empty segments must not understate its size — the
  // server still has to parse each one.
  test("counts empty segments in a malformed batch", () => {
    expect(countBatchedProcedures(`${origin}/api/trpc/a,,b`)).toBe(3);
  });

  test("returns null for a URL that is not a tRPC call", () => {
    expect(countBatchedProcedures(`${origin}/api/inngest`)).toBeNull();
    expect(countBatchedProcedures(`${origin}/dashboard`)).toBeNull();
  });

  test("returns null rather than throwing on an unparseable URL", () => {
    expect(countBatchedProcedures("not a url")).toBeNull();
  });
});

describe("exceedsBatchLimit", () => {
  test("allows a batch exactly at the cap", () => {
    const procedures = Array.from(
      { length: MAX_TRPC_BATCH_SIZE },
      (_, index) => `router.procedure${index}`,
    );
    expect(exceedsBatchLimit(batchUrl(procedures))).toBe(false);
  });

  test("rejects one procedure over the cap", () => {
    const procedures = Array.from(
      { length: MAX_TRPC_BATCH_SIZE + 1 },
      (_, index) => `router.procedure${index}`,
    );
    expect(exceedsBatchLimit(batchUrl(procedures))).toBe(true);
  });

  test("leaves non-tRPC requests alone", () => {
    expect(exceedsBatchLimit(`${origin}/api/inngest`)).toBe(false);
  });
});
