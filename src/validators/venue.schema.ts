import { z } from "zod";
import { Venues } from "../generated/prisma/client";

export const venueStatusSchema = z.enum(["active", "inactive", "archived"]);

export const createVenueSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1),
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
  status: venueStatusSchema.optional(),
});

export const updateVenueSchema = createVenueSchema.partial().extend({
  id: z.string().min(1),
});

export const deleteVenueSchema = z.object({
  id: z.string().min(1),
});

export const getAllVenuesSchema = z.object({
  companyId: z.string().min(1).optional(),
  status: venueStatusSchema.optional(),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type DeleteVenueInput = z.infer<typeof deleteVenueSchema>;
export type GetAllVenuesInput = z.infer<typeof getAllVenuesSchema>;
export type Venue = Venues;
