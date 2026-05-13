import { z } from "zod";

export const createTransactionCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const updateTransactionCategorySchema = createTransactionCategorySchema.partial().extend({
  id: z.string().min(1),
});

export const deleteTransactionCategorySchema = z.object({
  id: z.string().min(1),
});

export type CreateTransactionCategoryInput = z.infer<typeof createTransactionCategorySchema>;
export type UpdateTransactionCategoryInput = z.infer<typeof updateTransactionCategorySchema>;
export type DeleteTransactionCategoryInput = z.infer<typeof deleteTransactionCategorySchema>;
