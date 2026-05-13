import { z } from "zod";

export const createBudgetSchema = z.object({
  name: z.string().optional().nullable(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  status: z.string().optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteBudgetSchema = z.object({
  id: z.string().min(1),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type DeleteBudgetInput = z.infer<typeof deleteBudgetSchema>;
