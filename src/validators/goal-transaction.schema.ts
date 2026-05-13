import { z } from "zod";

export const createGoalTransactionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.number().optional(),
  date: z.coerce.date(),
});

export const updateGoalTransactionSchema = createGoalTransactionSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteGoalTransactionSchema = z.object({
  id: z.string().min(1),
});

export type CreateGoalTransactionInput = z.infer<typeof createGoalTransactionSchema>;
export type UpdateGoalTransactionInput = z.infer<typeof updateGoalTransactionSchema>;
export type DeleteGoalTransactionInput = z.infer<typeof deleteGoalTransactionSchema>;
