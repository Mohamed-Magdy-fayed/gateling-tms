"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PencilIcon,
  PlusIcon,
  StickyNoteIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState } from "react";
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
import { useOrgDateTimeFormat } from "@/features/system/students/progress/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { TraineeNoteDeleteDialog } from "./trainee-note-delete-dialog";
import {
  type EditableTraineeNote,
  TraineeNoteFormDialog,
} from "./trainee-note-form-dialog";

type NoteDialog =
  | { kind: "create" }
  | { kind: "edit"; note: EditableTraineeNote }
  | { kind: "delete"; noteId: string }
  | null;

/**
 * The student's staff-only log: who said what, when. Newest first, with the
 * author on every entry, so a colleague picking up a call knows the context
 * without asking around.
 */
export function TraineeNotesSection({ traineeId }: { traineeId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const dateFmt = useOrgDateTimeFormat();
  const [dialog, setDialog] = useState<NoteDialog>(null);

  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery(trpc.traineeNotes.list.queryOptions({ traineeId }));

  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null);
  };

  const addButton = (
    <Button
      type="button"
      size="sm"
      onClick={() => setDialog({ kind: "create" })}
    >
      <PlusIcon className="size-3.5" />
      {t("traineeNotes.add")}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("traineeNotes.title")}</CardTitle>
        <CardDescription>{t("traineeNotes.lead")}</CardDescription>
        <CardAction>{addButton}</CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<TriangleAlertIcon />}
            title={t("traineeNotes.loadFailedTitle")}
            description={t("errors.generic")}
          />
        ) : !notes || notes.length === 0 ? (
          <EmptyState
            icon={<StickyNoteIcon />}
            title={t("traineeNotes.emptyTitle")}
            description={t("traineeNotes.emptyDescription")}
            action={addButton}
          />
        ) : (
          <ul className="divide-y divide-border">
            {notes.map((note) => (
              <li key={note.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {note.body}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {t("traineeNotes.byline", {
                      author: note.createdBy,
                      date: dateFmt.format(note.createdAt),
                    })}
                    {note.updatedBy ? ` · ${t("traineeNotes.edited")}` : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("actions.edit")}
                    onClick={() =>
                      setDialog({
                        kind: "edit",
                        note: { id: note.id, body: note.body },
                      })
                    }
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("actions.delete")}
                    onClick={() =>
                      setDialog({ kind: "delete", noteId: note.id })
                    }
                  >
                    <Trash2Icon className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <TraineeNoteFormDialog
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        onOpenChange={closeDialog}
        traineeId={traineeId}
        note={dialog?.kind === "edit" ? dialog.note : null}
      />
      <TraineeNoteDeleteDialog
        open={dialog?.kind === "delete"}
        onOpenChange={closeDialog}
        noteId={dialog?.kind === "delete" ? dialog.noteId : null}
      />
    </Card>
  );
}
