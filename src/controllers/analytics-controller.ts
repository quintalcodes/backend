import { Context } from "hono";
import { AnalyticsService } from "../services/analytics-service";
import { getTenantPrismaFromContext } from "../lib/context-client";
import { z } from "zod";

const getMonthlyBudgetSummarySchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export type GetMonthlyBudgetSummaryInput = z.infer<typeof getMonthlyBudgetSummarySchema>;

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService = new AnalyticsService()) {}

  async getMonthlyBudgetSummary(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = getMonthlyBudgetSummarySchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const monthlyBudgetSummary = await this.analyticsService.getMonthlyBudgetSummary(
        prismaClient,
        validated.data.periodStart,
        validated.data.periodEnd,
      );

      return c.json(
        { message: "Monthly budget summary fetched successfully", data: monthlyBudgetSummary },
        200,
      );
    } catch (error) {
      return c.json({ message: "Error fetching monthly budget summary" }, 500);
    }
  }
}
