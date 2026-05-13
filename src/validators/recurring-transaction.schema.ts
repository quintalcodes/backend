import { z } from "zod";
import { recurringTypeSchema } from "./transaction.schema";

export const createRecurringTransactionSchema = z.object({
  accountId: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(["income", "expense"]),
  amount: z.number().optional(),
  recurringType: recurringTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  transactionCategoryId: z.string().min(1).optional().nullable(),
});

export const updateRecurringTransactionSchema = createRecurringTransactionSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteRecurringTransactionSchema = z.object({
  id: z.string().min(1),
});

export type CreateRecurringTransactionInput = z.infer<typeof createRecurringTransactionSchema>;
export type UpdateRecurringTransactionInput = z.infer<typeof updateRecurringTransactionSchema>;
export type DeleteRecurringTransactionInput = z.infer<typeof deleteRecurringTransactionSchema>;
