"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/features/core/i18n/client";
import type { BranchBreakdownRow } from "../server/queries";

type BranchBreakdownCardProps = {
  branches: BranchBreakdownRow[];
};

/**
 * "All branches" only: how the dashboard's totals and today's classes split
 * across branches (docs/designs/academy-branches.md).
 */
export function BranchBreakdownCard({ branches }: BranchBreakdownCardProps) {
  const { t, locale } = useTranslation();
  const numberFmt = new Intl.NumberFormat(locale === "ar" ? "ar" : "en");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.byBranch.title")}</CardTitle>
        <CardDescription>{t("dashboard.byBranch.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("organizations.branches.column")}</TableHead>
                <TableHead className="text-end">
                  {t("dashboard.stats.students")}
                </TableHead>
                <TableHead className="text-end">
                  {t("dashboard.stats.groups")}
                </TableHead>
                <TableHead className="text-end">
                  {t("dashboard.byBranch.todaysClasses")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {numberFmt.format(branch.students)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {numberFmt.format(branch.groups)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {numberFmt.format(branch.todaysClasses)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
