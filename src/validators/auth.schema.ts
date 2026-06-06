import { z } from "zod";

export const loginWithPasswordSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.email(),
});

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
