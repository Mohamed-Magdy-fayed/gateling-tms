/**
 * One colour per group on the calendar, picked by hashing the group's id.
 *
 * Hashed rather than assigned in display order so a group keeps its colour
 * from week to week and from one viewer to the next — "the orange one is
 * Level 3" has to stay true after navigating. Five hues from the brand scale
 * (Tag uses the same families), so two groups can collide; the block also
 * carries the group's name, and colour is the fast read, not the only one.
 */
export type GroupColor = {
  /** The block itself: tinted fill, solid inline-start bar, readable text. */
  block: string;
  /** The legend swatch and the dot in the edit dialog. */
  swatch: string;
};

const GROUP_COLORS: readonly GroupColor[] = [
  {
    block:
      "border-orange-500 bg-orange-500/15 text-orange-800 hover:bg-orange-500/25 dark:text-orange-200",
    swatch: "bg-orange-500",
  },
  {
    block:
      "border-sky-500 bg-sky-500/15 text-sky-800 hover:bg-sky-500/25 dark:text-sky-200",
    swatch: "bg-sky-500",
  },
  {
    block:
      "border-mint-600 bg-mint-500/15 text-mint-800 hover:bg-mint-500/25 dark:text-mint-200",
    swatch: "bg-mint-500",
  },
  {
    block:
      "border-violet-500 bg-violet-500/15 text-violet-600 hover:bg-violet-500/25 dark:text-violet-100",
    swatch: "bg-violet-500",
  },
  {
    block:
      "border-yellow-600 bg-yellow-400/25 text-yellow-600 hover:bg-yellow-400/35 dark:text-yellow-100",
    swatch: "bg-yellow-400",
  },
];

/** FNV-1a over the id — cheap, stable, and spreads uuids evenly. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function groupColor(groupId: string): GroupColor {
  return GROUP_COLORS[hashString(groupId) % GROUP_COLORS.length];
}
