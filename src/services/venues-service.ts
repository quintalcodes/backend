import { PrismaClient } from "../generated/prisma/client";
import { CreateVenueInput } from "../validators/venue.schema";

export class VenuesService {
  async createVenue(prisma: PrismaClient, authId: string, data: CreateVenueInput) {
    return prisma.venues.create({
      data,
    });
  }
}
