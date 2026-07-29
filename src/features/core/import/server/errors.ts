import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "@/integrations/trpc/init";
import { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_ROWS } from "../lib/limits";
import type { ImportFileProblem } from "./file";

type Translator = Pick<TRPCContext, "t">;

const BYTES_PER_MB = 1024 * 1024;

/**
 * Turns a parser problem code into a localized client error. A switch rather
 * than a lookup table because the messages take different parameters.
 */
export function importFileError(
  ctx: Translator,
  problem: ImportFileProblem,
): TRPCError {
  switch (problem) {
    case "tooLarge":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.fileTooLarge", {
          maxMb: MAX_IMPORT_FILE_BYTES / BYTES_PER_MB,
        }),
      });
    case "unsupportedFormat":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.unsupportedFormat"),
      });
    case "empty":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.emptyFile"),
      });
    case "tooManyRows":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.tooManyRows", {
          maxRows: MAX_IMPORT_ROWS,
        }),
      });
  }
}

export function missingColumnsError(
  ctx: Translator,
  missingColumnLabels: string[],
): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: ctx.t("import.errors.missingColumns", {
      columns: missingColumnLabels,
    }),
  });
}
