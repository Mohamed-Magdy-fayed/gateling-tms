"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
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
import {
  type GroupScheduleSlot,
  type GroupStatus,
  groupStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type GroupMutationInput,
  groupMutationSchema,
} from "@/features/system/learning-flow/groups/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";
import { GroupScheduleEditor } from "./group-schedule-editor";

export type EditableGroup = {
  id: string;
  name: string;
  courseId: string | null;
  teacherId: string | null;
  schedule: GroupScheduleSlot[];
  startDate: string;
  sessionCount: number;
  status: GroupStatus;
};

type GroupFormDialogProps = {
  group?: EditableGroup | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (groupId: string) => void;
  open: boolean;
};

/** Today as "YYYY-MM-DD" in the browser's zone — a sensible default start. */
function todayIsoDate(): string {
  const now = new Date();
  return [
    String(now.getFullYear()).padStart(4, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function GroupFormDialog({
  group,
  onOpenChange,
  onSaved,
  open,
}: GroupFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = group != null;

  const createMut = useMutation(trpc.groups.create.mutationOptions());
  const updateMut = useMutation(trpc.groups.update.mutationOptions());

  // Only fetched while the dialog is open — a group needs neither, so this
  // must never be on the critical path of opening the form.
  const { data: courses } = useQuery({
    ...trpc.courses.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
    enabled: open,
  });
  const { data: members } = useQuery({
    ...trpc.organizations.members.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
    }),
    enabled: open,
  });

  const defaultValues = useMemo<GroupMutationInput>(
    () => ({
      name: group?.name ?? "",
      courseId: group?.courseId ?? null,
      teacherId: group?.teacherId ?? null,
      status: group?.status ?? "active",
      startDate: group?.startDate ?? todayIsoDate(),
      sessionCount: group?.sessionCount ?? 12,
      schedule: group?.schedule ?? [],
    }),
    [group],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: groupMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<{ sessionsQueued: boolean; id?: string }> =
        isEdit && group
          ? updateMut.mutateAsync({ id: group.id, ...value })
          : createMut.mutateAsync(value);

      try {
        const result = await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "groups.updated" : "groups.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("groups.saveFailed"),
          })
          .unwrap();

        // The group itself saved; only the session generation enqueue failed.
        // Say so plainly rather than letting the roster look scheduled when
        // no sessions will appear.
        if (!result.sessionsQueued) {
          toast.warning(t("groups.sessionsQueueFailed"));
        }

        await queryClient.invalidateQueries({
          queryKey: trpc.groups.pathKey(),
        });
        onSaved?.(result.id ?? group?.id ?? "");
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) group, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, group?.id]);

  const pending = createMut.isPending || updateMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : isEdit ? SaveIcon : PlusIcon;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  const courseOptions = useMemo(
    () => [
      { value: "", label: t("groups.noCourse") },
      ...(courses?.rows ?? []).map((course) => ({
        value: course.id,
        label: course.name,
      })),
    ],
    [courses, t],
  );

  const teacherOptions = useMemo(
    () => [
      { value: "", label: t("groups.noTeacher") },
      ...(members?.rows ?? []).map((member) => ({
        value: member.userId,
        // A member can exist without a display name (OAuth sign-ups sometimes
        // arrive with none) — fall back to the email, then to the raw id, so
        // the option is never a blank row the operator can't identify.
        label: member.name || member.email || member.userId,
      })),
    ],
    [members, t],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "groups.edit" : "groups.add")}</DialogTitle>
          <DialogDescription>
            {t(isEdit ? "groups.editDescription" : "groups.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.StringField label={t("groups.name")} autoFocus />
                )}
              </form.AppField>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.AppField name="courseId">
                  {(field) => (
                    <field.SelectField
                      label={t("groups.course")}
                      options={courseOptions}
                    />
                  )}
                </form.AppField>

                <form.AppField name="teacherId">
                  {(field) => (
                    <field.SelectField
                      label={t("groups.teacher")}
                      options={teacherOptions}
                    />
                  )}
                </form.AppField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <form.AppField name="startDate">
                  {(field) => (
                    <field.StringField
                      label={t("groups.startDate")}
                      inputType="date"
                    />
                  )}
                </form.AppField>

                <form.AppField name="sessionCount">
                  {(field) => (
                    <field.NumberField label={t("groups.sessionCount")} />
                  )}
                </form.AppField>

                <form.AppField name="status">
                  {(field) => (
                    <field.SelectField
                      label={t("groups.status")}
                      options={groupStatusValues.map((status: GroupStatus) => ({
                        value: status,
                        label: t(`groups.statusOptions.${status}`),
                      }))}
                    />
                  )}
                </form.AppField>
              </div>

              <form.AppField name="schedule">
                {(field) => (
                  <GroupScheduleEditor
                    disabled={pending}
                    value={field.state.value}
                    onChange={(next) => field.handleChange(next)}
                  />
                )}
              </form.AppField>
            </FieldGroup>
          </FieldSet>
        </OverlayFormBody>

        <DialogFooter>
          <OverlayFormFooterActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              <XIcon className="size-3.5" />
              {t("actions.cancel")}
            </Button>
            <OverlayFormSubmitButton formId={formId} disabled={pending}>
              <SubmitIcon
                className={pending ? "size-3.5 animate-spin" : "size-3.5"}
              />
              {isEdit ? t("actions.save") : t("actions.create")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
