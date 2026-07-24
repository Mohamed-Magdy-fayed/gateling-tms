"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import {
  PreviewPanel,
  ResponsesSection,
} from "@/features/system/assessments/responses/admin";
import { SectionsSection } from "@/features/system/assessments/sections/admin";
import { useTRPC } from "@/integrations/trpc/client";

export function FormDetailPage({ formId }: { formId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const {
    data: form,
    isLoading,
    isError,
  } = useQuery(trpc.forms.get.queryOptions({ id: formId }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Spinner />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <EmptyState
        icon={<SearchXIcon />}
        title={t("assessments.notFoundTitle")}
        description={t("assessments.notFoundDescription")}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href="/assessments" />}
          >
            <ArrowLeftIcon className="size-3.5" />
            {t("assessments.backToList")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2"
          render={<Link href="/assessments" />}
        >
          <ArrowLeftIcon className="size-3.5" />
          {t("assessments.backToList")}
        </Button>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display font-bold text-2xl text-foreground">
            {form.title}
          </h1>
          <Tag color="violet">{t(`assessments.typeOptions.${form.type}`)}</Tag>
          <Tag
            color={
              form.status === "published"
                ? "green"
                : form.status === "archived"
                  ? "orange"
                  : "neutral"
            }
          >
            {t(`assessments.statusOptions.${form.status}`)}
          </Tag>
        </div>
        {form.description ? (
          <p className="mt-1 text-muted-foreground text-sm">
            {form.description}
          </p>
        ) : null}
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">
            {t("assessments.tabs.builder")}
          </TabsTrigger>
          <TabsTrigger value="preview">
            {t("assessments.tabs.preview")}
          </TabsTrigger>
          <TabsTrigger value="responses">
            {t("assessments.tabs.responses")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="builder" className="pt-4">
          <SectionsSection formId={form.id} />
        </TabsContent>
        <TabsContent value="preview" className="pt-4">
          <PreviewPanel form={form} />
        </TabsContent>
        <TabsContent value="responses" className="pt-4">
          <ResponsesSection formId={form.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
