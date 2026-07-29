"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AwardIcon,
  ExternalLinkIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { CertificateIssueDialog } from "./certificate-issue-dialog";
import { CertificateRevokeDialog } from "./certificate-revoke-dialog";
import { createCertificateDateFormat } from "./certificates-table-columns";

type RevokeTarget = { id: string; title: string } | null;

export function TraineeCertificatesSection({
  traineeId,
}: {
  traineeId: string;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const [issueOpen, setIssueOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget>(null);

  const {
    data: certificates,
    isLoading,
    isError,
  } = useQuery(
    trpc.certificates.list.queryOptions({
      page: 1,
      perPage: 50,
      sorting: [],
      traineeId,
    }),
  );
  // Dates are rendered on the academy's clock, which lives on the org (D80) —
  // the same reason the placement tests and sessions panels read it.
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  const timeZone = organization?.timeZone ?? "UTC";

  const dateFmt = useMemo(
    () => createCertificateDateFormat({ locale, timeZone }),
    [locale, timeZone],
  );

  const rows = certificates?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("certificates.title")}</CardTitle>
        <CardDescription>{t("certificates.lead")}</CardDescription>
        <CardAction>
          <Button type="button" size="sm" onClick={() => setIssueOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("certificates.issue")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          // A failed fetch also leaves `rows` empty — say so rather than let it
          // read as "this trainee has no certificates".
          <EmptyState
            icon={<TriangleAlertIcon />}
            title={t("certificates.loadFailedTitle")}
            description={t("errors.generic")}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<AwardIcon />}
            title={t("certificates.emptyTitle")}
            description={t("certificates.emptyDescription")}
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => setIssueOpen(true)}
              >
                <PlusIcon className="size-3.5" />
                {t("certificates.issue")}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((certificate) => (
              <li
                key={certificate.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {certificate.title}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {[certificate.courseName, certificate.groupName]
                      .filter(Boolean)
                      .join(" · ") || t("certificates.noCourse")}
                    {` · ${dateFmt.format(certificate.issuedAt)}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    render={<Link href={`/certificates/${certificate.id}`} />}
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    {t("certificates.view")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRevokeTarget({
                        id: certificate.id,
                        title: certificate.title,
                      })
                    }
                  >
                    {t("certificates.revoke")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CertificateIssueDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        traineeId={traineeId}
      />

      <CertificateRevokeDialog
        certificate={revokeTarget}
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      />
    </Card>
  );
}
