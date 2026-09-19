"use client";

import { Tag } from "@/components/ui/tag";
import type { EnrollmentLevelStatus, EnrollmentStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

const ENROLLMENT_STATUS_COLORS = {
  placementTest: "violet",
  waiting: "orange",
  ongoing: "green",
  completed: "blue",
  cancelled: "neutral",
  postponed: "neutral",
} as const satisfies Record<
  EnrollmentStatus,
  React.ComponentProps<typeof Tag>["color"]
>;

const LEVEL_STATUS_COLORS = {
  notStarted: "neutral",
  inProgress: "green",
  completed: "blue",
} as const satisfies Record<
  EnrollmentLevelStatus,
  React.ComponentProps<typeof Tag>["color"]
>;

export function EnrollmentStatusTag({ status }: { status: EnrollmentStatus }) {
  const { t } = useTranslation();
  return (
    <Tag color={ENROLLMENT_STATUS_COLORS[status]}>
      {t(`enrollments.statusOptions.${status}`)}
    </Tag>
  );
}

export function EnrollmentLevelStatusTag({
  status,
}: {
  status: EnrollmentLevelStatus;
}) {
  const { t } = useTranslation();
  return (
    <Tag color={LEVEL_STATUS_COLORS[status]}>
      {t(`enrollments.levels.statusOptions.${status}`)}
    </Tag>
  );
}
