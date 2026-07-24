import {
  BookOpenIcon,
  HeadsetIcon,
  MessageCircleIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";
import { getT } from "@/features/core/i18n/server";
import { FeatureModuleCard } from "./feature-module-card";

export async function PremiumFeaturesSection() {
  const { t } = await getT();
  const badge = t("features.premium.badge");

  const modules = [
    {
      key: "hr",
      icon: UsersIcon,
      title: t("features.modules.hr.title"),
      description: t("features.modules.hr.description"),
      bullets: [
        t("features.modules.hr.bullets.staffManagement"),
        t("features.modules.hr.bullets.payrollIntegration"),
        t("features.modules.hr.bullets.performanceTracking"),
        t("features.modules.hr.bullets.attendanceMonitoring"),
      ],
    },
    {
      key: "courseStore",
      icon: ShoppingCartIcon,
      title: t("features.modules.courseStore.title"),
      description: t("features.modules.courseStore.description"),
      bullets: [
        t("features.modules.courseStore.bullets.onlineMarketplace"),
        t("features.modules.courseStore.bullets.paymentProcessing"),
        t("features.modules.courseStore.bullets.coursePackaging"),
        t("features.modules.courseStore.bullets.salesAnalytics"),
      ],
    },
    {
      key: "crm",
      icon: BookOpenIcon,
      title: t("features.modules.crm.title"),
      description: t("features.modules.crm.description"),
      bullets: [
        t("features.modules.crm.bullets.leadManagement"),
        t("features.modules.crm.bullets.studentProfiles"),
        t("features.modules.crm.bullets.communicationHistory"),
        t("features.modules.crm.bullets.enrollmentTracking"),
      ],
    },
    {
      key: "smartForms",
      icon: ShieldIcon,
      title: t("features.modules.smartForms.title"),
      description: t("features.modules.smartForms.description"),
      bullets: [
        t("features.modules.smartForms.bullets.customForms"),
        t("features.modules.smartForms.bullets.dataCollection"),
        t("features.modules.smartForms.bullets.automatedWorkflows"),
        t("features.modules.smartForms.bullets.integrationCapabilities"),
      ],
    },
    {
      key: "community",
      icon: MessageCircleIcon,
      title: t("features.modules.community.title"),
      description: t("features.modules.community.description"),
      bullets: [
        t("features.modules.community.bullets.discussionForums"),
        t("features.modules.community.bullets.studentGroups"),
        t("features.modules.community.bullets.socialLearning"),
        t("features.modules.community.bullets.peerInteraction"),
      ],
    },
    {
      key: "support",
      icon: HeadsetIcon,
      title: t("features.modules.support.title"),
      description: t("features.modules.support.description"),
      bullets: [
        t("features.modules.support.bullets.ticketingSystem"),
        t("features.modules.support.bullets.liveChat"),
        t("features.modules.support.bullets.knowledgeBase"),
        t("features.modules.support.bullets.prioritySupport"),
      ],
    },
  ];

  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display font-bold text-3xl text-foreground">
            {t("features.premium.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("features.premium.description")}
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
              isFree={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
