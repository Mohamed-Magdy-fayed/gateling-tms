"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, PrinterIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * The certificate artifact itself (phase-05.md step 7).
 *
 * v1 renders one clean template in the browser and leans on print-to-PDF for
 * the downloadable file rather than generating a PDF server-side: no library
 * in `docs/rebuild/02-dependencies.md` can render one, and adding a headless
 * browser or PDF toolkit is a dependency-policy change, not a detail of this
 * step. `certificates.fileUrl` stays null until that call is made — the column
 * is ready for a Firebase-stored artifact whenever it is (STATE.md D87).
 *
 * Deliberately outside the `(system)` route group so the sidebar and header
 * are not part of the page at all; `print:` variants then only have to hide
 * this page's own controls.
 */
export function CertificatePrintView({
  certificateId,
}: {
  certificateId: string;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const {
    data: certificate,
    isLoading,
    isError,
  } = useQuery(trpc.certificates.get.queryOptions({ id: certificateId }));

  // Formatted on the academy's own clock (STATE.md D80), not the viewer's, so
  // the printed date matches the one shown everywhere else in the app.
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "long",
        timeZone: certificate?.organizationTimeZone ?? "UTC",
      }),
    [locale, certificate?.organizationTimeZone],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={<SearchXIcon />}
          title={t("certificates.notFoundTitle")}
          description={t("certificates.notFoundDescription")}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link href="/learning-flow/certificates" />}
            >
              <ArrowLeftIcon className="size-3.5" />
              {t("certificates.title")}
            </Button>
          }
        />
      </div>
    );
  }

  const subject =
    [certificate.courseName, certificate.groupName]
      .filter(Boolean)
      .join(" · ") || null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2"
          render={<Link href="/learning-flow/certificates" />}
        >
          <ArrowLeftIcon className="size-3.5" />
          {t("certificates.title")}
        </Button>
        <Button type="button" size="sm" onClick={() => window.print()}>
          <PrinterIcon className="size-3.5" />
          {t("certificates.print")}
        </Button>
      </div>

      {/* The document. Border and padding are kept on the printed page; the
          app's surrounding chrome is not. */}
      <article className="rounded-xl border-4 border-primary/20 bg-card p-8 text-center shadow-sm sm:p-14 print:rounded-none print:border-2 print:shadow-none">
        <p className="font-medium text-muted-foreground text-sm uppercase tracking-[0.2em]">
          {certificate.organizationName}
        </p>

        <h1 className="mt-8 font-display font-bold text-3xl text-foreground sm:text-4xl">
          {certificate.title}
        </h1>

        <p className="mt-8 text-muted-foreground text-sm">
          {t("certificates.presentedTo")}
        </p>
        <p className="mt-2 font-display font-bold text-2xl text-primary sm:text-3xl">
          {certificate.traineeName}
        </p>

        {subject ? (
          <p className="mt-6 text-foreground text-sm sm:text-base">
            {t("certificates.forCompleting", { subject })}
          </p>
        ) : null}

        <div className="mt-12 flex flex-col items-center gap-1 border-t pt-6 text-muted-foreground text-xs">
          <span>
            {t("certificates.issuedOn", {
              date: dateFmt.format(certificate.issuedAt),
            })}
          </span>
          {/* Printed so a paper copy can be traced back to the record. */}
          <span className="font-mono">{certificate.id}</span>
        </div>
      </article>
    </div>
  );
}
