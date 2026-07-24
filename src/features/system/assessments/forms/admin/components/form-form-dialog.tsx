"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Form, FormStatus, FormType } from "@/drizzle/schema";
import { formStatusValues, formTypeValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type FormMutationInput,
  formMutationSchema,
} from "@/features/system/assessments/forms/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

const NONE = "__none__";

type FormFormDialogProps = {
  form?: Form | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function FormFormDialog({
  form: existingForm,
  onOpenChange,
  open,
}: FormFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = existingForm != null;

  const [courseId, setCourseId] = useState(existingForm?.courseId ?? "");
  const [levelId, setLevelId] = useState(existingForm?.levelId ?? "");
  const [lectureId, setLectureId] = useState(existingForm?.lectureId ?? "");

  const { data: coursesData } = useQuery(
    trpc.courses.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
  );
  const { data: levels } = useQuery(
    trpc.levels.list.queryOptions({ courseId }, { enabled: courseId !== "" }),
  );
  const { data: lectures } = useQuery(
    trpc.lectures.list.queryOptions({ levelId }, { enabled: levelId !== "" }),
  );

  const createMut = useMutation(trpc.forms.create.mutationOptions());
  const updateMut = useMutation(trpc.forms.update.mutationOptions());

  const defaultValues = useMemo<
    Omit<FormMutationInput, "courseId" | "levelId" | "lectureId">
  >(
    () => ({
      type: existingForm?.type ?? "assignment",
      status: existingForm?.status ?? "draft",
      title: existingForm?.title ?? "",
      description: existingForm?.description ?? "",
    }),
    [existingForm],
  );

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: formMutationSchema.omit({
        courseId: true,
        levelId: true,
        lectureId: true,
      }),
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        courseId: courseId || null,
        levelId: levelId || null,
        lectureId: lectureId || null,
      };

      const action: Promise<unknown> =
        isEdit && existingForm
          ? updateMut.mutateAsync({ id: existingForm.id, ...payload })
          : createMut.mutateAsync(payload);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "assessments.updated" : "assessments.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("assessments.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.forms.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) form, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setCourseId(existingForm?.courseId ?? "");
      setLevelId(existingForm?.levelId ?? "");
      setLectureId(existingForm?.lectureId ?? "");
    }
  }, [open, existingForm?.id]);

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

  const handleCourseChange = useCallback((value: string) => {
    const next = value === NONE ? "" : value;
    setCourseId(next);
    setLevelId("");
    setLectureId("");
  }, []);

  const handleLevelChange = useCallback((value: string) => {
    const next = value === NONE ? "" : value;
    setLevelId(next);
    setLectureId("");
  }, []);

  const handleLectureChange = useCallback((value: string) => {
    setLectureId(value === NONE ? "" : value);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(isEdit ? "assessments.edit" : "assessments.add")}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEdit
                ? "assessments.editDescription"
                : "assessments.addDescription",
            )}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="title">
                {(field) => (
                  <field.StringField
                    label={t("assessments.formTitle")}
                    autoFocus
                  />
                )}
              </form.AppField>

              <form.AppField name="description">
                {(field) => (
                  <field.TextareaField
                    label={t("assessments.description")}
                    rows={3}
                  />
                )}
              </form.AppField>

              <div className="grid grid-cols-2 gap-4">
                <form.AppField name="type">
                  {(field) => (
                    <field.SelectField
                      label={t("assessments.type")}
                      options={formTypeValues.map((type: FormType) => ({
                        value: type,
                        label: t(`assessments.typeOptions.${type}`),
                      }))}
                    />
                  )}
                </form.AppField>

                <form.AppField name="status">
                  {(field) => (
                    <field.SelectField
                      label={t("assessments.status")}
                      options={formStatusValues.map((status: FormStatus) => ({
                        value: status,
                        label: t(`assessments.statusOptions.${status}`),
                      }))}
                    />
                  )}
                </form.AppField>
              </div>

              <div className="space-y-1.5">
                <span className="font-medium text-foreground text-sm">
                  {t("assessments.attachToCourse")}
                </span>
                <Select
                  value={courseId || NONE}
                  onValueChange={(value) => handleCourseChange(value as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("assessments.notAttached")}>
                      {(val) =>
                        val === NONE
                          ? t("assessments.notAttached")
                          : (coursesData?.rows.find((c) => c.id === val)
                              ?.name ?? t("assessments.notAttached"))
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>
                      {t("assessments.notAttached")}
                    </SelectItem>
                    {coursesData?.rows.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {courseId ? (
                <div className="space-y-1.5">
                  <span className="font-medium text-foreground text-sm">
                    {t("assessments.attachToLevel")}
                  </span>
                  <Select
                    value={levelId || NONE}
                    onValueChange={(value) =>
                      handleLevelChange(value as string)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("assessments.notAttached")}>
                        {(val) =>
                          val === NONE
                            ? t("assessments.notAttached")
                            : (levels?.find((l) => l.id === val)?.name ??
                              t("assessments.notAttached"))
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        {t("assessments.notAttached")}
                      </SelectItem>
                      {levels?.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {levelId ? (
                <div className="space-y-1.5">
                  <span className="font-medium text-foreground text-sm">
                    {t("assessments.attachToLecture")}
                  </span>
                  <Select
                    value={lectureId || NONE}
                    onValueChange={(value) =>
                      handleLectureChange(value as string)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("assessments.notAttached")}>
                        {(val) =>
                          val === NONE
                            ? t("assessments.notAttached")
                            : (lectures?.find((l) => l.id === val)?.name ??
                              t("assessments.notAttached"))
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        {t("assessments.notAttached")}
                      </SelectItem>
                      {lectures?.map((lecture) => (
                        <SelectItem key={lecture.id} value={lecture.id}>
                          {lecture.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
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
