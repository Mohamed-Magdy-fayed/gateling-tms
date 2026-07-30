"use client";

import { DownloadIcon, UploadIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import {
  IMPORT_FILE_ACCEPT,
  type ImportCommitResult,
  type ImportPreviewResult,
  MAX_IMPORT_FILE_BYTES,
} from "../lib";
import { ImportReview } from "./components/import-review";

const BYTES_PER_MB = 1024 * 1024;

type EntityImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Template slug — `/api/import/templates/<entity>`. */
  entity: string;
  /** Runs on the server and returns the review, writing nothing. */
  onPreview: (input: {
    fileName: string;
    base64: string;
  }) => Promise<ImportPreviewResult>;
  /** Writes the confirmed rows. */
  onCommit: (rows: Record<string, string>[]) => Promise<ImportCommitResult>;
  onImported?: () => void;
};

/** `FileReader` hands back a data URL; the payload starts after the comma. */
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload → review → confirm, for any entity that supplies the two server
 * calls. Nothing about it is entity-specific: the columns, the row errors and
 * the plan-capacity cut-off all come back from `onPreview`.
 */
export function EntityImportDialog({
  entity,
  onCommit,
  onImported,
  onOpenChange,
  onPreview,
  open,
}: EntityImportDialogProps) {
  const { t } = useTranslation();
  const fileInputId = useId();
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    setPreview(null);
    setPending(false);
    onOpenChange(false);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      toast.error(
        t("import.errors.fileTooLarge", {
          maxMb: MAX_IMPORT_FILE_BYTES / BYTES_PER_MB,
        }),
      );
      return;
    }

    setPending(true);
    try {
      const base64 = await readAsBase64(file);
      setPreview(await onPreview({ fileName: file.name, base64 }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("import.previewFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    const rows = preview.validRows
      .slice(0, preview.importableCount)
      .map((row) => row.values);
    if (rows.length === 0) return;

    setPending(true);
    try {
      const result = await onCommit(rows);
      toast.success(t("import.imported", result));
      onImported?.();
      close();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("import.importFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.description")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {preview ? (
            <ImportReview preview={preview} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <a
                  className={buttonVariants({ variant: "outline" })}
                  href={`/api/import/templates/${entity}?format=xlsx`}
                  download
                >
                  <DownloadIcon className="size-3.5" />
                  {t("import.downloadXlsx")}
                </a>
                <a
                  className={buttonVariants({ variant: "outline" })}
                  href={`/api/import/templates/${entity}?format=csv`}
                  download
                >
                  <DownloadIcon className="size-3.5" />
                  {t("import.downloadCsv")}
                </a>
              </div>

              <div className="space-y-2">
                {/* A label driving a visually-hidden input, rather than a button
                  that fakes a click: the native picker and its keyboard
                  behaviour stay intact. The input comes first in the DOM so
                  the label can mirror its focus ring — otherwise a sighted
                  keyboard user tabs onto something with no visible state. */}
                <input
                  id={fileInputId}
                  type="file"
                  className="peer sr-only"
                  accept={IMPORT_FILE_ACCEPT}
                  disabled={pending}
                  onChange={(event) => {
                    void handleFile(event.target.files?.[0]);
                    // Lets the same file be picked again after a failed parse.
                    event.target.value = "";
                  }}
                />
                <label
                  className={buttonVariants({
                    className:
                      "cursor-pointer peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
                  })}
                  htmlFor={fileInputId}
                >
                  <UploadIcon className="size-3.5" />
                  {t("import.chooseFile")}
                </label>
                <Muted>
                  {t("import.fileHint", {
                    maxMb: MAX_IMPORT_FILE_BYTES / BYTES_PER_MB,
                  })}
                </Muted>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t("actions.cancel")}
          </Button>
          {preview && (
            <Button
              type="button"
              disabled={pending || preview.importableCount === 0}
              onClick={() => void handleConfirm()}
            >
              <LoadingSwap isLoading={pending}>
                {t("import.confirm", { count: preview.importableCount })}
              </LoadingSwap>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
