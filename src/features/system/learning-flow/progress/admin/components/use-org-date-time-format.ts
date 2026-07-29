"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * Date+time on the academy's own clock, which lives on the organization (D80).
 *
 * Without an explicit time zone the server formats in the host's and the
 * browser in the viewer's, which hydrates mismatched and shows the wrong day
 * either side of midnight. Both progress surfaces need exactly this format, so
 * it lives here rather than being rebuilt identically in each.
 *
 * The `organizations.getActive` read is shared with whatever else on the page
 * already asked for it — react-query dedupes it, so this costs no extra
 * request.
 */
export function useOrgDateTimeFormat(): Intl.DateTimeFormat {
  const { locale } = useTranslation();
  const trpc = useTRPC();

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  return useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: organization?.timeZone ?? "UTC",
      }),
    [locale, organization?.timeZone],
  );
}
