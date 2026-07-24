import { LibraryIcon, VideoIcon, WorkflowIcon } from "lucide-react";
import { getT } from "@/features/core/i18n/server";
import { FeatureModuleCard } from "./feature-module-card";

export async function FreeFeaturesSection() {
  const { t } = await getT();
  const badge = t("features.free.badge");

  const modules = [
    {
      key: "contentLibrary",
      icon: LibraryIcon,
      title: t("features.modules.contentLibrary.title"),
      description: t("features.modules.contentLibrary.description"),
      bullets: [
        t("features.modules.contentLibrary.bullets.digitalResources"),
        t("features.modules.contentLibrary.bullets.mediaManagement"),
        t("features.modules.contentLibrary.bullets.contentOrganization"),
        t("features.modules.contentLibrary.bullets.searchFiltering"),
      ],
    },
    {
      key: "learningFlow",
      icon: WorkflowIcon,
      title: t("features.modules.learningFlow.title"),
      description: t("features.modules.learningFlow.description"),
      bullets: [
        t("features.modules.learningFlow.bullets.courseStructure"),
        t("features.modules.learningFlow.bullets.progressTracking"),
        t("features.modules.learningFlow.bullets.assessments"),
        t("features.modules.learningFlow.bullets.certificates"),
      ],
    },
    {
      key: "liveClasses",
      icon: VideoIcon,
      title: t("features.modules.liveClasses.title"),
      description: t("features.modules.liveClasses.description"),
      bullets: [
        t("features.modules.liveClasses.bullets.hdVideoStreaming"),
        t("features.modules.liveClasses.bullets.interactiveWhiteboard"),
        t("features.modules.liveClasses.bullets.recordingCapabilities"),
        t("features.modules.liveClasses.bullets.screenSharing"),
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display font-bold text-3xl text-foreground">
          {t("features.free.title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("features.free.description")}
        </p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <FeatureModuleCard
            key={module.key}
            icon={module.icon}
            title={module.title}
            description={module.description}
            bullets={module.bullets}
            badge={badge}
            isFree
          />
        ))}
      </div>
    </section>
  );
}
