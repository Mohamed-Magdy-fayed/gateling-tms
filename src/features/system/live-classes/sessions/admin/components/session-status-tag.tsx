"use client";

import { Tag } from "@/components/ui/tag";
import type { SessionStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

const SESSION_STATUS_COLORS = {
  scheduled: "blue",
  ongoing: "green",
  completed: "neutral",
  cancelled: "orange",
} as const satisfies Record<
  SessionStatus,
  React.ComponentProps<typeof Tag>["color"]
>;

export function SessionStatusTag({ status }: { status: SessionStatus }) {
  const { t } = useTranslation();
  return (
    <Tag color={SESSION_STATUS_COLORS[status]}>
      {t(`sessions.statusOptions.${status}`)}
    </Tag>
  );
}
