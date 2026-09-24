import type { LucideIcon } from "lucide-react";
import {
  AwardIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
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
    | "nav.students"
    | "nav.groups"
    | "nav.enrollments"
    | "nav.certificates"
    | "nav.liveClasses"
    | "nav.platform";
  Icon: LucideIcon;
  /** Shown only to the platform owner (`users.isPlatformOwner`). */
  platformOwnerOnly?: true;
};

/**
 * DONOR-B's sidebar filters this list through a global role/screen
 * permission matrix (`hasPermission`) — TMS deliberately doesn't have one
 * (STATE.md D42: roles live per-organization-membership, not globally on the
 * user). Every item here is reachable by any authenticated org member except
 * the ones marked `platformOwnerOnly`; add role-gating per item only if a
 * future phase actually needs it.
 *
 * Students is the roster; its sub-pages (groups, enrollments, certificates)
 * live under the same /students prefix and get their own entries so each is
 * one click away.
 *
 * Live Classes is the session agenda, and it is the whole area: classes run
 * on Gateling Meetings through one deployment-level integration, so there is
 * nothing for an academy to connect and no "rooms" page beside it. The
 * register is reached from a session row rather than the sidebar.
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
    href: "/students",
    translationKey: "nav.students",
    Icon: GraduationCapIcon,
  },
  {
    href: "/students/groups",
    translationKey: "nav.groups",
    Icon: UsersIcon,
  },
  {
    href: "/students/enrollments",
    translationKey: "nav.enrollments",
    Icon: UserCheckIcon,
  },
  {
    href: "/students/certificates",
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
];

export const GENERAL_NAV_ITEMS: SystemNavItem[] = [
  {
    href: "/settings",
    translationKey: "nav.settings",
    Icon: SettingsIcon,
  },
  {
    // The platform owner's page: deployment-wide integrations (Gateling
    // Meetings) and, later, the academies list. Hidden from everyone else;
    // the page shows them an empty state and its routes return FORBIDDEN.
    href: "/platform",
    translationKey: "nav.platform",
    Icon: SlidersHorizontalIcon,
    platformOwnerOnly: true,
  },
];
