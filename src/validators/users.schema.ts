import {
  CompanyUserStatus,
  CompanyUsers,
  UserStatus,
  Users,
  VenueUserStatus,
  VenueUsers,
} from "../generated/prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  authId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.email(),
  userPhotoUrl: z.string().optional(),
  invitationId: z.string().optional(),
  status: z.enum(UserStatus).optional(),
});

export const updateUserSchema = createUserSchema.omit({ email: true }).partial().extend({
  id: z.string().min(1),
});

export const deleteUserSchema = z.object({
  id: z.string().min(1),
});

export const inviteUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  companyId: z.string(),
  venueId: z.string(),
  venueRoleId: z.string(),
});

export const createCompanyUserSchema = z.object({
  companyId: z.string().min(1),
  userId: z.string().min(1),
  companyRoleId: z.string().min(1),
  invitedByUserId: z.string().min(1),
});

export const updateCompanyUserSchema = createCompanyUserSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(CompanyUserStatus).optional(),
  isActive: z.boolean().optional(),
});

export const createVenueUserSchema = z.object({
  venueId: z.string().min(1),
  companyId: z.string(),
  userId: z.string().min(1),
  venueRoleId: z.string().min(1),
  invitedByUserId: z.string().min(1),
});

export const updateVenueUserSchema = createVenueUserSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(VenueUserStatus).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export type CreateCompanyUserInput = z.infer<typeof createCompanyUserSchema>;
export type UpdateCompanyUserInput = z.infer<typeof updateCompanyUserSchema>;

export type CreateVenueUserInput = z.infer<typeof createVenueUserSchema>;
export type UpdateVenueUserInput = z.infer<typeof updateVenueUserSchema>;

export type IUser = Users;
export type ICompanyUser = CompanyUsers;
export type IVenueUser = VenueUsers;
