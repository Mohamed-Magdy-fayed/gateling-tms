"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardListIcon,
  Loader2Icon,
  SaveIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useId, useMemo } from "react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type SessionEditFormValues,
  sessionEditDefaults,
  sessionEditFormSchema,
} from "@/features/system/live-classes/sessions/lib/session-edit-form";
import { isSessionEditable } from "@/features/system/live-classes/sessions/lib/session-editing";
import {
  timeToMinutes,
  zonedInstant,
} from "@/features/system/live-classes/sessions/lib/week";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { useTRPC } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";
import { SessionJoinActions } from "./session-join-actions";
import { SessionStatusTag } from "./session-status-tag";
import { groupColor } from "./week-calendar/group-colors";

export type TeacherOption = { value: string; label: string };

type SessionEditDialogProps = {
  session: SessionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The org's IANA zone — the date and time fields read on its clock. */
  timeZone: string;
  /** Staff may change the class; everyone else gets the details and the join button. */
  canEdit: boolean;
  liveClassesEnabled: boolean;
  teacherOptions: TeacherOption[];
};

/**
 * One class, opened from its block on the calendar.
 *
 * For staff on a still-scheduled class it is the precise alternative to
 * dragging: exact date, time, length, and teacher, with the same 15-minute
 * rule the grid snaps to. For everyone else — and for a class that already
 * ran — it is the details and the join button, the same actions the agenda
 * row offers.
 */
export function SessionEditDialog({
  session,
  open,
  onOpenChange,
  timeZone,
  canEdit,
  liveClassesEnabled,
  teacherOptions,
}: SessionEditDialogProps) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateMut = useMutation(trpc.sessions.update.mutationOptions());

  const editable =
    canEdit && session !== null && isSessionEditable(session.status);

  const defaultValues = useMemo<SessionEditFormValues>(
    () =>
      session
        ? sessionEditDefaults(session, timeZone)
        : { date: "", startTime: "", durationMinutes: 60, teacherId: "" },
    [session, timeZone],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: sessionEditFormSchema },
    onSubmit: async ({ value }) => {
      if (!session) return;
      const minutes = timeToMinutes(value.startTime);
      const scheduledAt =
        minutes === null ? null : zonedInstant(value.date, minutes, timeZone);
      if (!scheduledAt) {
        toast.error(t("groups.validation.date"));
        return;
      }

      try {
        await toast
          .promise(
            updateMut.mutateAsync({
              id: session.id,
              scheduledAt,
              durationMinutes: value.durationMinutes,
              teacherId: value.teacherId,
            }),
            {
              loading: t("common.loading"),
              success: t("sessions.edit.saved"),
              error: (err) =>
                err instanceof Error
                  ? err.message
                  : t("sessions.edit.saveFailed"),
            },
          )
          .unwrap();
        await queryClient.invalidateQueries({
          queryKey: trpc.sessions.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the dialog opens for a (possibly different) session, not on every form identity change
  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, session?.id]);

  const formId = useId();
  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  const dateTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        timeZone,
        dateStyle: "full",
        timeStyle: "short",
      }),
    [locale, timeZone],
  );

  const options = useMemo(
    () => [{ value: "", label: t("groups.noTeacher") }, ...teacherOptions],
    [teacherOptions, t],
  );

  if (!session) return null;

  const pending = updateMut.isPending;
  const color = groupColor(session.groupId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={cn("size-3 shrink-0 rounded-full", color.swatch)}
            />
            {session.groupName}
          </DialogTitle>
          <DialogDescription>
            {dateTimeFmt.format(session.scheduledAt)}
            {" · "}
            {t("groups.sessions.durationValue", {
              minutes: session.durationMinutes,
            })}
            {session.teacherName ? ` · ${session.teacherName}` : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <SessionStatusTag status={session.status} />
          <SessionJoinActions
            session={session}
            liveClassesEnabled={liveClassesEnabled}
            canShareLink={canEdit}
          />
          {canEdit ? (
            <>
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/live-classes/sessions/${session.id}`} />}
              >
                <ClipboardListIcon className="size-3.5" />
                {t("sessions.register")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                render={<Link href={`/students/groups/${session.groupId}`} />}
              >
                <UsersIcon className="size-3.5" />
                {t("sessions.calendar.openGroup")}
              </Button>
            </>
          ) : null}
        </div>

        {editable ? (
          <>
            <p className="text-muted-foreground text-sm">
              {t("sessions.edit.description")}
            </p>
            <OverlayFormBody
              formId={formId}
              className="space-y-4"
              onSubmit={handleBodySubmit}
            >
              <FieldSet disabled={pending}>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.AppField name="date">
                      {(field) => (
                        <field.StringField
                          label={t("sessions.edit.date")}
                          inputType="date"
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="startTime">
                      {(field) => (
                        <field.StringField
                          label={t("sessions.edit.startTime")}
                          inputType="time"
                        />
                      )}
                    </form.AppField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.AppField name="durationMinutes">
                      {(field) => (
                        <field.NumberField
                          label={t("sessions.edit.duration")}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="teacherId">
                      {(field) => (
                        <field.SelectField
                          label={t("sessions.edit.teacher")}
                          options={options}
                        />
                      )}
                    </form.AppField>
                  </div>
                </FieldGroup>
              </FieldSet>
            </OverlayFormBody>
          </>
        ) : canEdit ? (
          <p className="text-muted-foreground text-sm">
            {t("sessions.errors.notEditable")}
          </p>
        ) : null}

        <DialogFooter>
          <OverlayFormFooterActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              <XIcon className="size-3.5" />
              {editable ? t("actions.cancel") : t("common.close")}
            </Button>
            {editable ? (
              <OverlayFormSubmitButton formId={formId} disabled={pending}>
                {pending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <SaveIcon className="size-3.5" />
                )}
                {t("actions.save")}
              </OverlayFormSubmitButton>
            ) : null}
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
