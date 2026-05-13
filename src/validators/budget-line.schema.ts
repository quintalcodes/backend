import { z } from "zod";

export const createBudgetLineSchema = z.object({
  budgetId: z.string().min(1),
  transactionCategoryId: z.string().optional().nullable(),
  categoryLabel: z.string().optional().nullable(),
  amount: z.number(),
});

export const updateBudgetLineSchema = createBudgetLineSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteBudgetLineSchema = z.object({
  id: z.string().min(1),
});

export type CreateBudgetLineInput = z.infer<typeof createBudgetLineSchema>;
export type UpdateBudgetLineInput = z.infer<typeof updateBudgetLineSchema>;
export type DeleteBudgetLineInput = z.infer<typeof deleteBudgetLineSchema>;
