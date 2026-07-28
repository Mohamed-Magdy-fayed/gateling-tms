"use client";

import { Tag } from "@/components/ui/tag";
import type { PlacementTestStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

const PLACEMENT_TEST_STATUS_COLORS = {
  pending: "orange",
  inProgress: "violet",
  completed: "green",
  cancelled: "neutral",
} as const satisfies Record<
  PlacementTestStatus,
  React.ComponentProps<typeof Tag>["color"]
>;

export function PlacementTestStatusTag({
  status,
}: {
  status: PlacementTestStatus;
}) {
  const { t } = useTranslation();
  return (
    <Tag color={PLACEMENT_TEST_STATUS_COLORS[status]}>
      {t(`placementTests.statusOptions.${status}`)}
    </Tag>
  );
}
