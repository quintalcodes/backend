import { z } from "zod";

export const recurringTypeSchema = z.enum(["daily", "weekly", "fortnightly", "monthly", "yearly"]);

export const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().optional(),
  kind: z.enum(["income", "expense"]),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  description: z.string().min(1),
  transactionCategoryId: z.string().optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteTransactionSchema = z.object({
  id: z.string().min(1),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;
