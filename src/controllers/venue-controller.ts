import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { VenuesService } from "../services/venues-service";
import { createVenueSchema } from "../validators/venue.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class VenuesController {
  constructor(private readonly venuesService: VenuesService = new VenuesService()) {}

  async createVenue(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createVenueSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const venue = await this.venuesService.createVenue(prismaClient, authId, validated.data);
      log.info(`Venue created successfully: ${venue.id}`);

      return c.json({ message: "Venue created successfully", data: venue }, 201);
    } catch (error) {
      log.error("Failed to create venue", error);
      return c.json({ error: "Failed to create venue" }, 500);
    }
  }
}
