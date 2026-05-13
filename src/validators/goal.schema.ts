import { z } from "zod";

export const goalStatusSchema = z.enum(["active", "completed", "cancelled"]);

export const createGoalSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  targetAmount: z.number(),
  targetDate: z.coerce.date().optional().nullable(),
  category: z.string().optional().nullable(),
  status: goalStatusSchema.optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteGoalSchema = z.object({
  id: z.string().min(1),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type DeleteGoalInput = z.infer<typeof deleteGoalSchema>;
