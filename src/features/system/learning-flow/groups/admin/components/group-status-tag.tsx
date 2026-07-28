"use client";

import { Tag } from "@/components/ui/tag";
import type { GroupStatus, SessionStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

const GROUP_STATUS_COLORS = {
  active: "green",
  paused: "orange",
  completed: "blue",
  cancelled: "neutral",
} as const satisfies Record<
  GroupStatus,
  React.ComponentProps<typeof Tag>["color"]
>;

const SESSION_STATUS_COLORS = {
  scheduled: "blue",
  ongoing: "green",
  completed: "neutral",
  cancelled: "orange",
} as const satisfies Record<
  SessionStatus,
  React.ComponentProps<typeof Tag>["color"]
>;

export function GroupStatusTag({ status }: { status: GroupStatus }) {
  const { t } = useTranslation();
  return (
    <Tag color={GROUP_STATUS_COLORS[status]}>
      {t(`groups.statusOptions.${status}`)}
    </Tag>
  );
}

export function SessionStatusTag({ status }: { status: SessionStatus }) {
  const { t } = useTranslation();
  return (
    <Tag color={SESSION_STATUS_COLORS[status]}>
      {t(`groups.sessions.statusOptions.${status}`)}
    </Tag>
  );
}
