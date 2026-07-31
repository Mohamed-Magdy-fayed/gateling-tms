"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareQuoteIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { TestimonialFormDialog } from "./testimonial-form-dialog";

/**
 * Asks the academy owner for feedback, once.
 *
 * Renders nothing at all unless the caller is an admin who has neither written
 * feedback nor dismissed the ask — a dashboard is a working screen, and a
 * permanent banner asking for a favour is noise. `status` is admin-only, so it
 * is only requested when the caller is one.
 */
export function TestimonialPromptCard({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: status } = useQuery({
    ...trpc.testimonials.status.queryOptions(),
    enabled: isAdmin,
  });

  const dismissMut = useMutation({
    ...trpc.testimonials.dismissPrompt.mutationOptions(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: trpc.testimonials.pathKey() }),
  });

  if (!isAdmin || !status?.shouldPrompt) return null;

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareQuoteIcon className="size-4 text-primary" />
            {t("testimonials.prompt.title")}
          </CardTitle>
          <CardDescription>
            {t("testimonials.prompt.description")}
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              {t("testimonials.prompt.cta")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismissMut.mutate()}
              disabled={dismissMut.isPending}
            >
              {t("testimonials.prompt.dismiss")}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <TestimonialFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        testimonial={status.testimonial}
      />
    </>
  );
}
