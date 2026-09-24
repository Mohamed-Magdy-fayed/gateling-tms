"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { SessionList } from "./session-list";

/**
 * One day's classes under its date: the agenda's unit, and what the month
 * view shows on a phone and in its "+N more" popover.
 */
export function DaySessionsCard({
  id,
  label,
  sessions,
  liveClassesEnabled,
  timeZone,
  canOpenRegister,
  headerExtra,
}: {
  /** Lets the month view scroll a day into view ("Today"). */
  id?: string;
  label: string;
  sessions: SessionRow[];
  liveClassesEnabled: boolean;
  timeZone: string;
  canOpenRegister: boolean;
  /** Trailing header content, e.g. the month view's clash marker. */
  headerExtra?: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{label}</CardTitle>
        {headerExtra}
      </CardHeader>
      <CardContent>
        <SessionList
          sessions={sessions}
          liveClassesEnabled={liveClassesEnabled}
          timeZone={timeZone}
          showGroup
          canOpenRegister={canOpenRegister}
        />
      </CardContent>
    </Card>
  );
}
