import type { ZodType } from "zod";
import type { RowValidator } from "./rows";
import type { ImportRowError } from "./types";

/**
 * Adapts a Zod schema over one row's raw cell values into a `RowValidator`.
 * Issue messages come through untouched — throughout this repo they are
 * translation keys (`translationKey("forms.validation.required")`), which the
 * review screen resolves the same way form fields do.
 */
export function zodRowValidator<TParsed>(
  schema: ZodType<TParsed>,
): RowValidator<TParsed> {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { ok: true, parsed: result.data };

    const errors: ImportRowError[] = result.error.issues.map((issue) => ({
      column: typeof issue.path[0] === "string" ? issue.path[0] : "",
      message: issue.message,
    }));

    return { ok: false, errors };
  };
}
