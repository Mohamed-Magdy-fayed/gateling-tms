import { z } from "zod";
import { idSchema } from "@/lib/id-schema";

export const traineeProgressInput = z.object({
  traineeId: idSchema,
});

export const groupProgressInput = z.object({
  groupId: z.uuid(),
});

export type TraineeProgressInput = z.infer<typeof traineeProgressInput>;
export type GroupProgressInput = z.infer<typeof groupProgressInput>;
