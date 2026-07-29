import type { LucideIcon } from "lucide-react";
import {
  AwardIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  PlugZapIcon,
  SettingsIcon,
  UserCheckIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";

// Narrowed to the specific zero-argument keys nav items use (rather than the
// full `TranslationKey<typeof mainTranslations>` union) — `t()`'s signature
// requires a second (params) argument whenever *any* member of the key union
// passed to it needs one, and several unrelated keys elsewhere (e.g.
// `organizations.limits.*`) do.
export type SystemNavItem = {
  href: string;
  translationKey:
    | "nav.dashboard"
    | "nav.settings"
    | "nav.contentLibrary"
    | "nav.assessments"
    | "nav.learningFlow"
    | "nav.groups"
    | "nav.enrollments"
    | "nav.certificates"
    | "nav.liveClasses"
    | "nav.zoomConnections";
  Icon: LucideIcon;
};

/**
 * DONOR-B's sidebar filters this list through a global role/screen
 * permission matrix (`hasPermission`) — TMS deliberately doesn't have one
 * (STATE.md D42: roles live per-organization-membership, not globally on the
 * user). Every item here is reachable by any authenticated org member; add
 * role-gating per item only if a future phase actually needs it.
 *
 * Live Classes is the session agenda; the Zoom connections page sits beside
 * it as its own entry rather than being the area's landing page — the agenda
 * is what people open daily, and it works whether or not Zoom is connected.
 * The attendance view lands in the next Phase 6 segment and gets its own
 * entry then.
 */
export const SYSTEM_NAV_ITEMS: SystemNavItem[] = [
  {
    href: "/dashboard",
    translationKey: "nav.dashboard",
    Icon: LayoutDashboardIcon,
  },
  {
    href: "/content-library/courses",
    translationKey: "nav.contentLibrary",
    Icon: LibraryIcon,
  },
  {
    href: "/learning-flow/trainees",
    translationKey: "nav.learningFlow",
    Icon: GraduationCapIcon,
  },
  {
    href: "/learning-flow/groups",
    translationKey: "nav.groups",
    Icon: UsersIcon,
  },
  {
    href: "/learning-flow/enrollments",
    translationKey: "nav.enrollments",
    Icon: UserCheckIcon,
  },
  {
    href: "/learning-flow/certificates",
    translationKey: "nav.certificates",
    Icon: AwardIcon,
  },
  {
    href: "/assessments",
    translationKey: "nav.assessments",
    Icon: ClipboardListIcon,
  },
  {
    href: "/live-classes/sessions",
    translationKey: "nav.liveClasses",
    Icon: VideoIcon,
  },
  {
    href: "/live-classes/zoom-clients",
    translationKey: "nav.zoomConnections",
    Icon: PlugZapIcon,
  },
];

export const GENERAL_NAV_ITEMS: SystemNavItem[] = [
  {
    href: "/organizations",
    translationKey: "nav.settings",
    Icon: SettingsIcon,
  },
];
