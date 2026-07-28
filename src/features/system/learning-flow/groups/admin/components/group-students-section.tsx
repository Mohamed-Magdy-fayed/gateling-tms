"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, UsersIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { GroupStudentAddDialog } from "./group-student-add-dialog";

export function GroupStudentsSection({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: students, isLoading } = useQuery(
    trpc.groups.students.queryOptions({ id: groupId }),
  );
  const removeMut = useMutation(trpc.groups.removeStudent.mutationOptions());

  async function handleRemove(traineeId: string) {
    setRemovingId(traineeId);
    try {
      await toast
        .promise(removeMut.mutateAsync({ groupId, traineeId }), {
          loading: t("common.loading"),
          success: t("groups.students.removed"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("groups.students.removeFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({ queryKey: trpc.groups.pathKey() });
    } catch {
      // toast.promise already surfaced the failure.
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("groups.students.title")}</CardTitle>
        <CardDescription>
          {t("groups.students.lead", { count: students?.length ?? 0 })}
        </CardDescription>
        <CardAction>
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("groups.students.add")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !students || students.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title={t("groups.students.emptyTitle")}
            description={t("groups.students.emptyDescription")}
            action={
              <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
                <PlusIcon className="size-3.5" />
                {t("groups.students.add")}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {students.map((student) => (
              <li
                key={student.traineeId}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{student.name}</p>
                  {student.email || student.phone ? (
                    <p className="truncate text-muted-foreground text-xs">
                      {student.email ?? student.phone}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={t("groups.students.remove")}
                  disabled={removingId === student.traineeId}
                  onClick={() => void handleRemove(student.traineeId)}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <GroupStudentAddDialog
        groupId={groupId}
        open={addOpen}
        onOpenChange={setAddOpen}
        existingTraineeIds={(students ?? []).map(
          (student) => student.traineeId,
        )}
      />
    </Card>
  );
}
