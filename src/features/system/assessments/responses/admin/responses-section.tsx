"use client";

import { useQuery } from "@tanstack/react-query";
import { InboxIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

export function ResponsesSection({ formId }: { formId: string }) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const { data: responses, isFetching } = useQuery(
    trpc.responses.list.queryOptions({ formId }),
  );
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (responses && responses.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<InboxIcon />}
            title={t("responses.emptyTitle")}
            description={t("responses.emptyDescription")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={
        isFetching ? "space-y-2 opacity-80 transition-opacity" : "space-y-2"
      }
    >
      {responses?.map((response) => (
        <Card key={response.id} className="gap-0 py-3">
          <CardContent className="flex items-center justify-between gap-3 px-4">
            <div>
              <p className="font-medium text-foreground text-sm">
                {response.respondent.name ?? response.respondent.email}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("responses.submittedAt")}:{" "}
                {dateFmt.format(new Date(response.submittedAt))}
              </p>
            </div>
            <Tag color={response.score === null ? "orange" : "green"}>
              {response.score === null
                ? t("responses.scorePending")
                : `${t("responses.score")}: ${response.score}`}
            </Tag>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
