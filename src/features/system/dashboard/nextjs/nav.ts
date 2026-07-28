import type { LucideIcon } from "lucide-react";
import {
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  SettingsIcon,
  UsersIcon,
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
    | "nav.groups";
  Icon: LucideIcon;
};

/**
 * DONOR-B's sidebar filters this list through a global role/screen
 * permission matrix (`hasPermission`) — TMS deliberately doesn't have one
 * (STATE.md D42: roles live per-organization-membership, not globally on the
 * user). Every item here is reachable by any authenticated org member; add
 * role-gating per item only if a future phase actually needs it.
 *
 * Live Classes is intentionally still absent — phase-02.md step 8 calls for
 * "no dead links", and its routes don't exist until Phase 6. Add it here
 * when its pages land.
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
    href: "/assessments",
    translationKey: "nav.assessments",
    Icon: ClipboardListIcon,
  },
];

export const GENERAL_NAV_ITEMS: SystemNavItem[] = [
  {
    href: "/organizations",
    translationKey: "nav.settings",
    Icon: SettingsIcon,
  },
];
