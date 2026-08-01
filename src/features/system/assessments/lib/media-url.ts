import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

/**
 * A URL that is safe to put in an `<img src>` or an `<iframe src>`.
 *
 * `z.url()` alone only checks that the value parses as an absolute URL, which
 * `javascript:alert(1)` and `data:text/html,…` both do. Either would be stored
 * and then rendered straight into an attribute the browser executes — the
 * answer sheet renders whatever a block or question carries.
 *
 * The empty string is the "no media" value: these schemas are shared with
 * TanStack Form, which needs the validator's input type to match its form
 * values, so a cleared field has to be a legal value here (the mutation
 * normalizes it to null).
 */
const HTTP_URL = /^https?:\/\//i;

export const mediaUrlSchema = z
  .union([z.url(), z.literal("")])
  .refine((value) => value === "" || HTTP_URL.test(value), {
    message: translationKey("forms.validation.url"),
  });
