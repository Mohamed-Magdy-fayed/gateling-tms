"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type PlacementTestReviewDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  placementTestId: string;
  traineeName: string;
};

/**
 * Assigns the level the trainee starts at.
 *
 * Course then level, mirroring the assessments form dialog's attachment
 * chain — `levels.list` is scoped to one course, and picking a level without
 * knowing which course it belongs to would be ambiguous once two courses have
 * a level with the same name.
 */
export function PlacementTestReviewDialog({
  onOpenChange,
  open,
  placementTestId,
  traineeName,
}: PlacementTestReviewDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [courseId, setCourseId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [feedback, setFeedback] = useState("");

  const reviewMut = useMutation(trpc.placementTests.review.mutationOptions());

  const { data: courses } = useQuery({
    ...trpc.courses.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
    enabled: open,
  });
  const { data: levels } = useQuery({
    ...trpc.levels.list.queryOptions({ courseId }),
    enabled: open && courseId !== "",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: clears the choices when the dialog opens for a (possibly different) test, not on every render
  useEffect(() => {
    if (open) {
      setCourseId("");
      setLevelId("");
      setFeedback("");
    }
  }, [open, placementTestId]);

  async function handleConfirm() {
    if (!levelId) return;

    try {
      await toast
        .promise(
          reviewMut.mutateAsync({
            id: placementTestId,
            assignedLevelId: levelId,
            feedback,
          }),
          {
            loading: t("common.loading"),
            success: t("placementTests.reviewed"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("placementTests.reviewFailed"),
          },
        )
        .unwrap();
      // Reviewing can also advance the trainee's enrollment, so both caches
      // are stale afterwards.
      await queryClient.invalidateQueries({
        queryKey: trpc.placementTests.pathKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.enrollments.pathKey(),
      });
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  const courseRows = courses?.rows ?? [];
  const levelRows = levels ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("placementTests.review")}</DialogTitle>
          <DialogDescription>
            {t("placementTests.reviewDescription", { name: traineeName })}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("enrollments.course")}</Label>
            <Select
              value={courseId}
              disabled={reviewMut.isPending}
              onValueChange={(next) => {
                setCourseId(next ?? "");
                // The previously picked level belongs to the old course.
                setLevelId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(selected) =>
                    courseRows.find((course) => course.id === selected)?.name ??
                    ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courseRows.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("placementTests.level")}</Label>
            <Select
              value={levelId}
              disabled={reviewMut.isPending || courseId === ""}
              onValueChange={(next) => setLevelId(next ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(selected) =>
                    levelRows.find((level) => level.id === selected)?.name ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {levelRows.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`feedback-${placementTestId}`}>
              {t("placementTests.feedback")}
            </Label>
            <Textarea
              id={`feedback-${placementTestId}`}
              rows={3}
              value={feedback}
              disabled={reviewMut.isPending}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reviewMut.isPending}
          >
            <XIcon className="size-3.5" />
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!levelId || reviewMut.isPending}
          >
            {reviewMut.isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <CheckIcon className="size-3.5" />
            )}
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
