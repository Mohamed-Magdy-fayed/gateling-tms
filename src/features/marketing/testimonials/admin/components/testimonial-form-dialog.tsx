"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SendIcon, XIcon } from "lucide-react";
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
  type TestimonialSubmitInput,
  testimonialSubmitSchema,
} from "@/features/marketing/testimonials/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type OwnTestimonial = {
  quote: string;
  authorName: string;
  authorRole: string | null;
  imageUrl: string | null;
  isPublic: boolean;
};

type TestimonialFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  testimonial?: OwnTestimonial | null;
};

export function TestimonialFormDialog({
  onOpenChange,
  open,
  testimonial,
}: TestimonialFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const submitMut = useMutation(trpc.testimonials.submit.mutationOptions());

  const defaultValues = useMemo<TestimonialSubmitInput>(
    () => ({
      quote: testimonial?.quote ?? "",
      authorName: testimonial?.authorName ?? "",
      authorRole: testimonial?.authorRole ?? "",
      imageUrl: testimonial?.imageUrl ?? "",
      isPublic: testimonial?.isPublic ?? false,
    }),
    [testimonial],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: testimonialSubmitSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(submitMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("testimonials.form.success"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("testimonials.form.success"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.testimonials.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens, not on every defaultValues identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, testimonial?.quote]);

  const pending = submitMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : SendIcon;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("testimonials.form.title")}</DialogTitle>
          <DialogDescription>
            {t("testimonials.form.description")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="quote">
                {(field) => (
                  <field.TextareaField
                    label={t("testimonials.form.quoteLabel")}
                    placeholder={t("testimonials.form.quotePlaceholder")}
                    autoFocus
                  />
                )}
              </form.AppField>

              <form.AppField name="authorName">
                {(field) => (
                  <field.StringField
                    label={t("testimonials.form.authorNameLabel")}
                    placeholder={t("testimonials.form.authorNamePlaceholder")}
                  />
                )}
              </form.AppField>

              <form.AppField name="authorRole">
                {(field) => (
                  <field.StringField
                    label={t("testimonials.form.authorRoleLabel")}
                    placeholder={t("testimonials.form.authorRolePlaceholder")}
                  />
                )}
              </form.AppField>

              <form.AppField name="imageUrl">
                {(field) => (
                  <field.ImageField
                    label={t("testimonials.form.imageLabel")}
                    description={t("testimonials.form.imageHint")}
                    folder="testimonials"
                  />
                )}
              </form.AppField>

              <form.AppField name="isPublic">
                {(field) => (
                  <field.BooleanField
                    label={t("testimonials.form.consentLabel")}
                    description={t("testimonials.form.consentDescription")}
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
              {pending
                ? t("testimonials.form.submitting")
                : t("testimonials.form.submit")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
