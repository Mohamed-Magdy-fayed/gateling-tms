"use client";

import { FileDownIcon } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/features/core/i18n/client";
import type { MessageKey } from "@/features/core/import/lib";

type ExportableEntity = {
  /** The same slug the import template and dialog use. */
  entity: string;
  /** The entity's own name, so a page offering two exports can tell them apart. */
  titleKey: MessageKey;
};

type EntityExportButtonProps = {
  entities: ExportableEntity[];
};

/**
 * Downloads every row the organization has, in the shape its import template
 * accepts — the other half of the round trip the import already supports
 * (STATE.md D118). Sits beside the data table's own CSV export, which stays
 * for looking at whatever is currently on screen.
 *
 * Plain download links rather than a fetch: the file is built by
 * `/api/import/exports/<entity>`, which the browser can save directly.
 */
export function EntityExportButton({ entities }: EntityExportButtonProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            aria-label={t("import.exportTitle")}
          >
            <FileDownIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {entities.map((exportable, index) => (
          <Fragment key={exportable.entity}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t(exportable.titleKey, {})}
              </DropdownMenuLabel>
              <DropdownMenuItem
                render={
                  <a
                    href={`/api/import/exports/${exportable.entity}?format=xlsx`}
                    download
                  >
                    {t("import.exportXlsx")}
                  </a>
                }
              />
              <DropdownMenuItem
                render={
                  <a
                    href={`/api/import/exports/${exportable.entity}?format=csv`}
                    download
                  >
                    {t("import.exportCsv")}
                  </a>
                }
              />
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
