"use client";

import { InfoIcon, ListChecksIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { MappedForm } from "@/features/system/assessments/google-import/lib";

/**
 * What the import would produce, shown before anything is written — including
 * every item that changed shape or was left out. phase-07.md step 5 asks for
 * exactly this: unsupported question types "flagged in preview … not silently
 * dropped".
 */
export function GoogleFormPreview({ preview }: { preview: MappedForm }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("googleImport.previewTitle")}</CardTitle>
        <CardDescription>{preview.title}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Tag color="violet">
            {t("googleImport.sectionsCount", {
              count: preview.sections.length,
            })}
          </Tag>
          <Tag color="green">
            {t("googleImport.questionsCount", {
              count: preview.questionCount,
            })}
          </Tag>
        </div>

        {preview.isQuiz && (
          <Alert>
            <InfoIcon />
            <AlertDescription>
              {t("googleImport.quizDetected")}
            </AlertDescription>
          </Alert>
        )}

        {preview.questionCount === 0 ? (
          <Alert variant="warning">
            <InfoIcon />
            <AlertDescription>
              {t("googleImport.nothingToImport")}
            </AlertDescription>
          </Alert>
        ) : (
          <ul className="space-y-3">
            {preview.sections.map((section) => (
              <li key={`${section.order}-${section.title}`}>
                <p className="flex items-center gap-2 font-medium text-sm">
                  <ListChecksIcon className="size-4 text-muted-foreground" />
                  {section.title}
                </p>
                <Muted className="ms-6 text-xs">
                  {t("googleImport.questionsCount", {
                    count: section.questions.length,
                  })}
                </Muted>
              </li>
            ))}
          </ul>
        )}

        {preview.notes.length > 0 && (
          <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 p-4">
            <p className="font-medium text-sm">
              {t("googleImport.notImportedTitle")}
            </p>
            <Muted className="text-xs">
              {t("googleImport.notImportedDescription")}
            </Muted>
            <ul className="list-disc space-y-1 ps-5 text-sm">
              {preview.notes.map((note) => (
                <li key={note.id}>
                  {t(`googleImport.note.${note.code}`, { title: note.title })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
