import { z } from "zod";

export const accountTypeSchema = z.enum([
  "spending",
  "checking",
  "savings",
  "credit card",
  "cash",
  "crypto",
  "other",
]);

export const createAccountSchema = z.object({
  name: z.string().min(1),
  type: accountTypeSchema,
  balance: z.number().optional(),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteAccountSchema = z.object({
  id: z.string().min(1),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
