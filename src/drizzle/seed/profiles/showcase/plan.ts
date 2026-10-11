import { type ActivityRows, planActivity } from "./activity";
import { SHOWCASE_BRANCHES } from "./catalog";
import { type PlannedBranch, planCohorts } from "./cohorts";
import { type ContentRows, planContent } from "./content";
import { stableId } from "./determinism";
import { planStructure, type StructureRows } from "./records";
import { planTeachers } from "./teachers";

export type ShowcasePlan = {
  content: ContentRows;
  structure: StructureRows;
  activity: ActivityRows;
  cohortCount: number;
};

/**
 * Every row the showcase academy should have at `now`. Pure: no database, no
 * wall clock — the writer decides what is missing, and tests can pin `now`.
 */
export function planShowcase(input: {
  organizationId: string;
  timeZone: string;
  now: Date;
}): ShowcasePlan {
  const branches: PlannedBranch[] = SHOWCASE_BRANCHES.map((branch) => ({
    ...branch,
    id: stableId(`branch:${branch.key}`),
  }));
  const teachers = planTeachers();
  const { rows: content, courses } = planContent(input.organizationId);
  const { cohorts, trainees } = planCohorts({
    now: input.now,
    timeZone: input.timeZone,
    courses,
    branches,
    teachers,
  });
  const { rows: structure, profiles } = planStructure({
    organizationId: input.organizationId,
    now: input.now,
    branches,
    teachers,
    cohorts,
    trainees,
  });
  const activity = planActivity({
    organizationId: input.organizationId,
    now: input.now,
    cohorts,
    profiles,
  });
  return {
    content,
    structure,
    activity,
    cohortCount: cohorts.filter(
      (c) => c.createdAt.getTime() <= input.now.getTime(),
    ).length,
  };
}
