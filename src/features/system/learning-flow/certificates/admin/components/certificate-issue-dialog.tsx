"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AwardIcon, Loader2Icon, XIcon } from "lucide-react";
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
  type CertificateMutationInput,
  certificateMutationSchema,
} from "@/features/system/learning-flow/certificates/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type CertificateIssueDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  traineeId: string;
};

// Issued, never edited: a certificate is a record of something that happened,
// so a mistake is revoked and re-issued rather than rewritten in place.
export function CertificateIssueDialog({
  onOpenChange,
  open,
  traineeId,
}: CertificateIssueDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const issueMut = useMutation(trpc.certificates.issue.mutationOptions());

  // Only the trainee's *completed* enrollments are offered, because that is
  // exactly what `issueCertificate` will accept — offering the rest would just
  // route the user into a server-side rejection.
  const { data: enrollments } = useQuery({
    ...trpc.enrollments.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
      traineeId,
      status: "completed",
    }),
    enabled: open,
  });

  const { data: groups } = useQuery({
    ...trpc.groups.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
    enabled: open,
  });

  const defaultValues = useMemo<CertificateMutationInput>(
    () => ({
      traineeId,
      title: "",
      courseId: "",
      groupId: "",
    }),
    [traineeId],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: certificateMutationSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(issueMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("certificates.issued"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("certificates.issueFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.certificates.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, traineeId]);

  const pending = issueMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : AwardIcon;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  const courseOptions = useMemo(
    () =>
      (enrollments?.rows ?? []).map((enrollment) => ({
        value: enrollment.courseId,
        label: enrollment.courseName,
      })),
    [enrollments],
  );

  const groupOptions = useMemo(
    () =>
      (groups?.rows ?? []).map((group) => ({
        value: group.id,
        label: group.name,
      })),
    [groups],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("certificates.issue")}</DialogTitle>
          <DialogDescription>
            {t("certificates.issueDescription")}
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
                    label={t("certificates.certificateTitle")}
                    description={t("certificates.titleDescription")}
                  />
                )}
              </form.AppField>

              <form.AppField name="courseId">
                {(field) => (
                  <field.SelectField
                    label={t("certificates.course")}
                    description={t("certificates.courseDescription")}
                    options={courseOptions}
                    placeholder={t("certificates.noCourse")}
                  />
                )}
              </form.AppField>

              <form.AppField name="groupId">
                {(field) => (
                  <field.SelectField
                    label={t("certificates.group")}
                    options={groupOptions}
                    placeholder={t("certificates.noGroup")}
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
              {t("certificates.issue")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
