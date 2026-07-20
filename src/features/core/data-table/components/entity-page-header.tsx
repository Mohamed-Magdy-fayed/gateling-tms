"use client";

import { H2, Lead } from "@/components/ui/typography";

type EntityPageHeaderProps = {
  title: string;
  lead: string;
};

// Donor B looks up title/lead copy through a whole-app entity registry
// (`features/system/registry`, indexed by every system page's slug). TARGET
// doesn't have that registry yet — it only exists once every system-page
// module is in place (Phase 4+) — so this takes the translated strings
// directly. Re-wire to a registry lookup if/when one is built.
export function EntityPageHeader({ title, lead }: EntityPageHeaderProps) {
  return (
    <div className="space-y-1">
      <H2>{title}</H2>
      <Lead>{lead}</Lead>
    </div>
  );
}
