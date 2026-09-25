"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ListIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { H2, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import {
  parseSessionJoinResultCode,
  SESSION_JOIN_RESULT_PARAM,
} from "@/features/system/live-classes/sessions/lib/join-result";
import {
  SESSION_VIEWS,
  type SessionView,
  viewAnchorParams,
} from "@/features/system/live-classes/sessions/lib/view-anchor";
import { todayInZone } from "@/features/system/live-classes/sessions/lib/week";
import { useTRPC } from "@/integrations/trpc/client";
import { SessionsAgenda } from "./components/sessions-agenda";
import { SessionsMonthView } from "./components/sessions-month-view";
import { SessionsWeekView } from "./components/sessions-week-view";

const VIEW_PARAM = "view";
type View = SessionView;

function isView(value: string | null): value is View {
  return (SESSION_VIEWS as readonly string[]).includes(value ?? "");
}

/**
 * The Live Classes area: one set of sessions, three ways to look at it.
 *
 * The week grid is the scheduling tool — where staff see the shape of a
 * week, move classes, and check a teacher's availability. The list is the
 * same rows as an agenda, which is what a phone shows best. The choice
 * lives in the URL like the week and the teacher filter do, so a shared
 * link opens on the view it was copied from.
 */
export function LiveClassesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  const requestedView = searchParams.get(VIEW_PARAM);
  const view: View = isView(requestedView) ? requestedView : "week";

  // The join route lands back here when it couldn't send someone into a
  // room, carrying only a fixed code (lib/join-result.ts) — never text.
  const joinResult = parseSessionJoinResultCode(
    searchParams.get(SESSION_JOIN_RESULT_PARAM),
  );

  function changeView(next: string) {
    if (!isView(next)) return;
    // Keep your place: the week you were on opens its month, and back.
    const timeZone = organization?.timeZone ?? "UTC";
    const params = viewAnchorParams(
      view,
      next,
      searchParams,
      todayInZone(new Date(), timeZone),
      timeZone,
    );
    params.set(VIEW_PARAM, next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <H2>{t("sessions.title")}</H2>
          {/* Says exactly what the product does and where the class itself
              happens — the same promise the landing page makes (D8). */}
          <Muted>{t("sessions.lead")}</Muted>
        </div>
        <SegmentedControl
          size="sm"
          value={view}
          onValueChange={changeView}
          options={[
            {
              value: "week",
              label: t("sessions.view.week"),
              icon: <CalendarRangeIcon className="size-3.5" />,
            },
            {
              value: "month",
              label: t("sessions.view.month"),
              icon: <CalendarIcon className="size-3.5" />,
            },
            {
              value: "list",
              label: t("sessions.view.list"),
              icon: <ListIcon className="size-3.5" />,
            },
          ]}
        />
      </div>

      {joinResult ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>
            {t(`sessions.errors.${joinResult}`)}
          </AlertDescription>
        </Alert>
      ) : null}

      {view === "week" ? (
        <SessionsWeekView />
      ) : view === "month" ? (
        <SessionsMonthView />
      ) : (
        <SessionsAgenda />
      )}
    </div>
  );
}
