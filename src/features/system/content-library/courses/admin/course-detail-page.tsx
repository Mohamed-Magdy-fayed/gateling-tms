"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { LevelsSection } from "@/features/system/content-library/levels/admin";
import { useTRPC } from "@/integrations/trpc/client";

export function CourseDetailPage({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const { data: course, isLoading } = useQuery(
    trpc.courses.get.queryOptions({ id: courseId }),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Spinner />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2"
          render={<Link href="/content-library/courses" />}
        >
          <ArrowLeftIcon className="size-3.5" />
          {t("courses.title")}
        </Button>
        <h1 className="mt-2 font-display font-bold text-2xl text-foreground">
          {course.name}
        </h1>
        {course.description ? (
          <p className="mt-1 text-muted-foreground text-sm">
            {course.description}
          </p>
        ) : null}
      </div>

      <LevelsSection courseId={course.id} />
    </div>
  );
}
