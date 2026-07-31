"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { TestimonialFormDialog } from "./testimonial-form-dialog";

type OwnTestimonial = {
  quote: string;
  authorName: string;
  authorRole: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  approvedAt: Date | null;
} | null;

/**
 * Which of the two publication statuses a saved testimonial is in. Kept
 * separate from the card so the mapping from (isPublic, approvedAt) to a
 * sentence is stated once.
 */
function statusKey(testimonial: OwnTestimonial) {
  if (!testimonial) return "testimonials.settings.statusNone" as const;
  if (!testimonial.isPublic)
    return "testimonials.settings.statusPrivate" as const;
  return testimonial.approvedAt
    ? ("testimonials.settings.statusApproved" as const)
    : ("testimonials.settings.statusPending" as const);
}

/** Everything this academy publishes on gateling.com, in one place. */
export function PublicShowcaseCard() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: status } = useQuery(trpc.testimonials.status.queryOptions());

  const consentMut = useMutation({
    ...trpc.testimonials.setShowcaseConsent.mutationOptions(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: trpc.testimonials.pathKey() }),
  });

  const testimonial = status?.testimonial ?? null;
  const isApproved =
    testimonial?.isPublic === true && testimonial.approvedAt != null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("testimonials.settings.title")}</CardTitle>
          <CardDescription>
            {t("testimonials.settings.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field orientation="horizontal">
            <Switch
              id="public-showcase-consent"
              checked={status?.hasShowcaseConsent ?? false}
              disabled={!status || consentMut.isPending}
              onCheckedChange={(consented) => consentMut.mutate({ consented })}
            />
            <FieldContent>
              <FieldLabel htmlFor="public-showcase-consent">
                {t("testimonials.settings.showcaseLabel")}
              </FieldLabel>
              <FieldDescription>
                {t("testimonials.settings.showcaseDescription")}
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-sm">
                {t("testimonials.settings.feedbackTitle")}
              </h3>
              {isApproved && (
                <Tag color="green">
                  {t("testimonials.settings.statusApproved")}
                </Tag>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {t(statusKey(testimonial))}
            </p>
            {testimonial && (
              <blockquote className="border-border border-s-2 ps-3 text-foreground text-sm italic">
                {testimonial.quote}
              </blockquote>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              disabled={!status}
            >
              {t(
                testimonial
                  ? "testimonials.settings.editCta"
                  : "testimonials.settings.writeCta",
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TestimonialFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        testimonial={testimonial}
      />
    </>
  );
}
