"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Muted } from "@/components/ui/typography";
import { useAuth } from "@/features/core/auth/nextjs/components/auth-provider";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type AvailabilitySlot,
  type AvailabilityWindow,
  addAvailabilityWindow,
  isWithinAvailability,
  removeAvailabilitySlot,
} from "@/features/system/live-classes/availability/lib/slots";
import {
  addIsoDays,
  type IsoDate,
  todayInZone,
  WEEK_DAY_ORDER,
  weekDates,
  weekStartOf,
  zonedInstant,
} from "@/features/system/live-classes/sessions/lib/week";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { useTRPC } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";
import { SessionEditDialog } from "./session-edit-dialog";
import { TeacherFilterSelect, useTeacherFilter } from "./teacher-filter";
import type { Placement } from "./week-calendar/geometry";
import { groupColor } from "./week-calendar/group-colors";
import { WeekCalendar } from "./week-calendar/week-calendar";

const WEEK_PARAM = "week";

/**
 * The calendar view of the agenda: one week at a time, Saturday first,
 * with the week and the teacher filter kept in the URL so a "look at next
 * week for Sara" link means the same thing to whoever opens it.
 *
 * Owns every server interaction the grid needs — the week's classes, the
 * teacher list, the selected teacher's availability, and the two mutations
 * — so `WeekCalendar` itself stays a pure drawing-and-pointer component.
 */
export function SessionsWeekView() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const timeZone = organization?.timeZone ?? "UTC";
  const role = organization?.role;
  const isStaff = role !== undefined && role !== "student";
  const auth = useAuth();
  const viewerId = auth.isAuthenticated ? auth.session.user.id : undefined;

  // URL state. The week is snapped to a Saturday client-side too, so the
  // grid never draws a mid-week start while the server's answer is in flight.
  const requestedWeek = searchParams.get(WEEK_PARAM);
  const weekStart = useMemo<IsoDate>(
    () =>
      weekStartOf(requestedWeek ?? todayInZone(new Date(), timeZone), timeZone),
    [requestedWeek, timeZone],
  );
  const [paintMode, setPaintMode] = useState(false);
  const leavePaintMode = useCallback(() => setPaintMode(false), []);
  const { teacherId, teacherOptions, selectedTeacher, setTeacher } =
    useTeacherFilter({ enabled: isStaff, onTeacherChange: leavePaintMode });

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.sessions.week.queryOptions({ weekStart, teacherId }),
  );

  const { data: availabilityRows } = useQuery({
    ...trpc.teacherAvailability.list.queryOptions({ teacherId }),
    enabled: isStaff && teacherId !== undefined,
  });
  const availability = useMemo<AvailabilitySlot[]>(
    () =>
      (availabilityRows ?? []).map(({ day, startTime, endTime }) => ({
        day,
        startTime,
        endTime,
      })),
    [availabilityRows],
  );

  // Same rule as the server's `canSetAvailability`: admins edit anyone's,
  // teachers their own. Mirrored here only to hide a button that would fail.
  const canEditAvailability =
    teacherId !== undefined &&
    (role === "admin" || (role === "teacher" && viewerId === teacherId));
  const paintingAvailability = paintMode && canEditAvailability;

  const setAvailabilityMut = useMutation(
    trpc.teacherAvailability.set.mutationOptions(),
  );
  const saveAvailability = useCallback(
    async (slots: AvailabilitySlot[]) => {
      if (!teacherId) return;
      try {
        await setAvailabilityMut.mutateAsync({ teacherId, slots });
        await queryClient.invalidateQueries({
          queryKey: trpc.teacherAvailability.pathKey(),
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("sessions.availability.saveFailed"),
        );
      }
    },
    [queryClient, setAvailabilityMut, t, teacherId, trpc],
  );

  const updateMut = useMutation(trpc.sessions.update.mutationOptions());
  const [pendingPlacements, setPendingPlacements] = useState<
    Record<string, Placement>
  >({});
  const days = useMemo(() => weekDates(weekStart), [weekStart]);

  const moveSession = useCallback(
    async (session: SessionRow, placement: Placement) => {
      const scheduledAt = zonedInstant(
        days[placement.dayIndex],
        placement.start,
        timeZone,
      );
      if (!scheduledAt) return;

      // The block stays where it was dropped while the save is in flight;
      // on failure it snaps back, on success the refetch confirms it.
      setPendingPlacements((current) => ({
        ...current,
        [session.id]: placement,
      }));
      try {
        await updateMut.mutateAsync({
          id: session.id,
          scheduledAt,
          durationMinutes: placement.durationMinutes,
          teacherId: session.teacherId,
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.sessions.pathKey(),
        });
        toast.success(t("sessions.calendar.moved"));

        // A heads-up, not a veto — the availability table is advisory and
        // the person dragging may know better.
        if (
          selectedTeacher &&
          session.teacherId === selectedTeacher.value &&
          availability.length > 0 &&
          !isWithinAvailability(availability, {
            day: WEEK_DAY_ORDER[placement.dayIndex],
            start: placement.start,
            end: placement.start + placement.durationMinutes,
          })
        ) {
          toast.warning(
            t("sessions.edit.outsideAvailability", {
              name: selectedTeacher.label,
            }),
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("sessions.calendar.moveFailed"),
        );
      } finally {
        setPendingPlacements((current) => {
          const { [session.id]: _dropped, ...rest } = current;
          return rest;
        });
      }
    },
    [
      availability,
      days,
      queryClient,
      selectedTeacher,
      t,
      timeZone,
      trpc,
      updateMut,
    ],
  );

  const [openSession, setOpenSession] = useState<SessionRow | null>(null);

  const rangeLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    });
    const from = zonedInstant(weekStart, 12 * 60, timeZone);
    const to = zonedInstant(addIsoDays(weekStart, 6), 12 * 60, timeZone);
    return from && to ? fmt.formatRange(from, to) : weekStart;
  }, [locale, timeZone, weekStart]);

  const legend = useMemo(() => {
    const seen = new Map<string, string>();
    for (const session of data?.rows ?? []) {
      if (!seen.has(session.groupId))
        seen.set(session.groupId, session.groupName);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("sessions.calendar.previousWeek")}
            onClick={() =>
              setParams({ [WEEK_PARAM]: addIsoDays(weekStart, -7) })
            }
          >
            <ChevronLeftIcon className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setParams({ [WEEK_PARAM]: null })}
          >
            {t("sessions.calendar.today")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("sessions.calendar.nextWeek")}
            onClick={() =>
              setParams({ [WEEK_PARAM]: addIsoDays(weekStart, 7) })
            }
          >
            <ChevronRightIcon className="size-4 rtl:rotate-180" />
          </Button>
        </div>
        <span className="font-semibold text-sm">{rangeLabel}</span>

        {isStaff ? (
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <TeacherFilterSelect
              id="sessions-teacher-filter"
              teacherId={teacherId}
              teacherOptions={teacherOptions}
              onChange={setTeacher}
            />

            {canEditAvailability ? (
              <Button
                type="button"
                variant={paintMode ? "default" : "outline"}
                size="sm"
                aria-pressed={paintMode}
                onClick={() => setPaintMode((current) => !current)}
              >
                {paintMode ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <PencilIcon className="size-3.5" />
                )}
                {t(
                  paintMode
                    ? "sessions.availability.done"
                    : "sessions.availability.edit",
                )}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isStaff ? (
        <Muted className="text-xs">
          {paintingAvailability && selectedTeacher
            ? t("sessions.availability.hint", { name: selectedTeacher.label })
            : selectedTeacher && availability.length === 0
              ? t("sessions.availability.empty", {
                  name: selectedTeacher.label,
                })
              : t("sessions.calendar.dragHint")}
        </Muted>
      ) : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {t("sessions.calendar.loadFailed")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              {t("sessions.calendar.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isError && !data ? null : isLoading || !data ? (
        <Skeleton className="h-[60vh] w-full rounded-xl" />
      ) : (
        <>
          <WeekCalendar
            weekStart={data.weekStart}
            timeZone={data.timeZone}
            sessions={data.rows}
            availability={selectedTeacher ? availability : []}
            canEdit={isStaff}
            paintMode={paintingAvailability}
            pendingPlacements={pendingPlacements}
            onMoveSession={moveSession}
            onOpenSession={setOpenSession}
            onPaintAvailability={(window: AvailabilityWindow) =>
              void saveAvailability(addAvailabilityWindow(availability, window))
            }
            onRemoveAvailability={(slot) =>
              void saveAvailability(removeAvailabilitySlot(availability, slot))
            }
          />

          {data.rows.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon />}
              title={t("sessions.emptyTitle")}
              description={t("sessions.calendar.emptyWeek")}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">
                {t("sessions.calendar.legend")}
              </span>
              {legend.map(([groupId, groupName]) => (
                <span
                  key={groupId}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      groupColor(groupId).swatch,
                    )}
                  />
                  {groupName}
                </span>
              ))}
              {selectedTeacher && availability.length > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-success/30 ring-1 ring-success/50" />
                  {t("sessions.availability.legend")}
                </span>
              ) : null}
            </div>
          )}
        </>
      )}

      <SessionEditDialog
        session={openSession}
        open={openSession !== null}
        onOpenChange={(open) => {
          if (!open) setOpenSession(null);
        }}
        timeZone={timeZone}
        canEdit={isStaff}
        liveClassesEnabled={data?.liveClassesEnabled ?? false}
        teacherOptions={teacherOptions}
      />
    </div>
  );
}
