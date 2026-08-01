"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { FormBlock, FormBlockKind } from "@/drizzle/schema";
import { formBlockKindValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type BlockMutationInput,
  blockMutationSchema,
} from "@/features/system/assessments/blocks/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type BlockFormDialogProps = {
  block?: FormBlock | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  sectionId: string;
};

export function BlockFormDialog({
  block,
  onOpenChange,
  open,
  sectionId,
}: BlockFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = block != null;

  const createMut = useMutation(trpc.blocks.create.mutationOptions());
  const updateMut = useMutation(trpc.blocks.update.mutationOptions());

  const defaultValues = useMemo<BlockMutationInput>(
    () => ({
      sectionId,
      kind: block?.kind ?? "text",
      title: block?.title ?? "",
      body: block?.body ?? "",
      // An imported image whose fetch hasn't landed has a null `mediaUrl`;
      // showing the empty field is honest, and saving from here settles the
      // block on whatever the author picks instead.
      mediaUrl: block?.mediaUrl ?? "",
      mediaAlt: block?.mediaAlt ?? "",
    }),
    [sectionId, block],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: blockMutationSchema },
    onSubmit: async ({ value }) => {
      const { sectionId: _sectionId, ...fields } = value;
      const action: Promise<unknown> =
        isEdit && block
          ? updateMut.mutateAsync({ id: block.id, ...fields })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "blocks.updated" : "blocks.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("blocks.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({ queryKey: trpc.blocks.pathKey() });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) block, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, block?.id]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "blocks.edit" : "blocks.add")}</DialogTitle>
          <DialogDescription>
            {t(isEdit ? "blocks.editDescription" : "blocks.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="kind">
                {(field) => (
                  <field.SelectField
                    label={t("blocks.kind")}
                    options={formBlockKindValues.map((kind: FormBlockKind) => ({
                      value: kind,
                      label: t(`blocks.kindOptions.${kind}`),
                    }))}
                  />
                )}
              </form.AppField>

              <form.AppField name="title">
                {(field) => (
                  <field.StringField label={t("blocks.heading")} autoFocus />
                )}
              </form.AppField>

              {/* Subscribing to `kind` rather than reading it off the form
                  means switching kind re-renders only these fields. The values
                  of the hidden ones are kept, not cleared, so flipping back and
                  forth doesn't lose what was typed — the mutation is what
                  settles the block on one shape. */}
              <form.Subscribe selector={(state) => state.values.kind}>
                {(kind) =>
                  kind === "text" ? (
                    <form.AppField name="body">
                      {(field) => (
                        <field.TextareaField label={t("blocks.body")} rows={6} />
                      )}
                    </form.AppField>
                  ) : kind === "image" ? (
                    <>
                      <form.AppField name="mediaUrl">
                        {(field) => (
                          <field.ImageField
                            label={t("blocks.image")}
                            folder="assessments"
                          />
                        )}
                      </form.AppField>
                      <form.AppField name="mediaAlt">
                        {(field) => (
                          <field.StringField
                            label={t("blocks.imageAlt")}
                            description={t("blocks.imageAltHint")}
                          />
                        )}
                      </form.AppField>
                    </>
                  ) : (
                    <form.AppField name="mediaUrl">
                      {(field) => (
                        <field.StringField
                          label={t("blocks.videoUrl")}
                          description={t("blocks.videoUrlHint")}
                        />
                      )}
                    </form.AppField>
                  )
                }
              </form.Subscribe>
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
