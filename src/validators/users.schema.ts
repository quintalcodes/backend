import { Users } from "../generated/prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  authId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.email(),
  userPhotoUrl: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteUserSchema = z.object({
  id: z.string().min(1),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

export type IUser = Users;
