import { z } from "zod";

export const loginWithPasswordSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
