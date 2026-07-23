import {
  BookOpenIcon,
  HeadsetIcon,
  LibraryIcon,
  type LucideIcon,
  MessageCircleIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UsersIcon,
  VideoIcon,
  WorkflowIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { getT } from "@/features/core/i18n/server";
import { cn } from "@/lib/utils";

const modules: Array<{
  key:
    | "contentLibrary"
    | "learningFlow"
    | "liveClasses"
    | "hr"
    | "courseStore"
    | "crm"
    | "smartForms"
    | "community"
    | "support";
  icon: LucideIcon;
  isFree: boolean;
}> = [
  { key: "contentLibrary", icon: LibraryIcon, isFree: true },
  { key: "learningFlow", icon: WorkflowIcon, isFree: true },
  { key: "liveClasses", icon: VideoIcon, isFree: true },
  { key: "hr", icon: UsersIcon, isFree: false },
  { key: "courseStore", icon: ShoppingCartIcon, isFree: false },
  { key: "crm", icon: BookOpenIcon, isFree: false },
  { key: "smartForms", icon: ShieldIcon, isFree: false },
  { key: "community", icon: MessageCircleIcon, isFree: false },
  { key: "support", icon: HeadsetIcon, isFree: false },
];

export async function FeaturesPreviewSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-bold text-primary text-xs uppercase tracking-wider">
          {t("landing.featuresPreview.eyebrow")}
        </p>
        <h2 className="mt-2 font-display font-bold text-3xl text-foreground">
          {t("landing.featuresPreview.title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("landing.featuresPreview.subtitle")}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ key, icon: Icon, isFree }) => (
          <Card
            key={key}
            className={cn(
              "transition-transform duration-300 ease-out-soft hover:-translate-y-1",
              isFree ? "ring-1 ring-primary/20" : "opacity-80",
            )}
          >
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    isFree
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {isFree ? (
                  <Tag color="green">{t("landing.featuresPreview.free")}</Tag>
                ) : (
                  <Tag color="neutral">
                    {t("landing.featuresPreview.comingSoon")}
                  </Tag>
                )}
              </div>
              <h3 className="font-display font-semibold text-foreground">
                {t(`landing.featuresPreview.modules.${key}.title`)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t(`landing.featuresPreview.modules.${key}.description`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
