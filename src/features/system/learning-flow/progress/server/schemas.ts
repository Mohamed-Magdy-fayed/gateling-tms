import { z } from "zod";

export const traineeProgressInput = z.object({
  traineeId: z.uuid(),
});

export const groupProgressInput = z.object({
  groupId: z.uuid(),
});

export type TraineeProgressInput = z.infer<typeof traineeProgressInput>;
export type GroupProgressInput = z.infer<typeof groupProgressInput>;
