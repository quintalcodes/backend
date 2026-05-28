import { PrismaClient } from "../generated/prisma/client";
import { CreateVenueInput, GetAllVenuesInput } from "../validators/venue.schema";

export class VenuesService {
  async createVenue(prisma: PrismaClient, authId: string, data: CreateVenueInput) {
    return prisma.venues.create({
      data,
    });
  }

  async getAllVenues(prisma: PrismaClient, authId: string, query: GetAllVenuesInput) {
    // only return venues that the user has access to.
    return prisma.venues.findMany({
      where: {
        venueUsers: {
          some: {
            user: {
              authId,
            },
          },
        },
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
