import { H3, Muted } from "@/components/ui/typography";
import { getT } from "@/features/core/i18n/server";

export default async function DashboardPage() {
  const { t } = await getT();

  return (
    <div className="space-y-1">
      <H3>{t("dashboard.placeholder.title")}</H3>
      <Muted>{t("dashboard.placeholder.description")}</Muted>
    </div>
  );
}
