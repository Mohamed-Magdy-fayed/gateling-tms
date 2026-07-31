"use client";

import type { ComponentProps } from "react";
import { Tag } from "@/components/ui/tag";
import type { AttendanceStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

const ATTENDANCE_STATUS_COLORS = {
  present: "green",
  absent: "orange",
} as const satisfies Record<
  AttendanceStatus,
  ComponentProps<typeof Tag>["color"]
>;

/**
 * A null status is its own state, not a third value: no teacher has said
 * anything about this trainee for this class yet. Nothing else ever will —
 * attendance is marked by hand (STATE.md D144).
 */
export function AttendanceStatusTag({
  status,
}: {
  status: AttendanceStatus | null;
}) {
  const { t } = useTranslation();

  if (!status) {
    return <Tag color="neutral">{t("attendance.statusOptions.unmarked")}</Tag>;
  }

  return (
    <Tag color={ATTENDANCE_STATUS_COLORS[status]}>
      {t(`attendance.statusOptions.${status}`)}
    </Tag>
  );
}
