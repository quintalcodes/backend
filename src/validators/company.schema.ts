import { z } from "zod";
import { Companies } from "../generated/prisma/client";

export const companyStatusSchema = z.enum(["active", "inactive", "archived"]);

export const createCompanySchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional().nullable(),
  tradeName: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.email().optional().nullable(),
  website: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: companyStatusSchema.optional(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().min(1),
});

export const deleteCompanySchema = z.object({
  id: z.string().min(1),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type DeleteCompanyInput = z.infer<typeof deleteCompanySchema>;
export type Company = Companies;
