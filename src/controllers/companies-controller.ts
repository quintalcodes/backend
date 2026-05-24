// import type { Context } from "hono";
// import { z } from "zod";
// import { log } from "../utils/logger";
// // import { CompaniesService } from "../services/companies-service";
// import { createCompanySchema, updateCompanySchema } from "../validators/company.schema";
// import { getTenantPrismaFromContext } from "../lib/context-client";

// export class CompaniesController {
//   constructor(private readonly companiesService: CompaniesService = new CompaniesService()) {}

//   async createCompany(c: Context) {
//     try {
//       const { prismaClient, authId } = getTenantPrismaFromContext(c);
//       const body = await c.req.json();
//       const validated = createCompanySchema.safeParse(body);

//       if (!validated.success) {
//         return c.json({ error: z.treeifyError(validated.error) }, 400);
//       }

//       const company = await this.companiesService.createCompany(
//         prismaClient,
//         authId,
//         validated.data,
//       );
//       log.info(`Company created successfully: ${company.id}`);

//       return c.json({ message: "Company created successfully", data: company }, 201);
//     } catch (error) {
//       return c.json({ message: "Error creating Company" }, 500);
//     }
//   }

//   async getCompanies(c: Context) {
//     try {
//       const { prismaClient, authId } = getTenantPrismaFromContext(c);
//       const companies = await this.companiesService.getCompanies(prismaClient, authId);
//       return c.json({ message: "Companies fetched successfully", data: companies }, 200);
//     } catch (error) {
//       return c.json({ message: "Error fetching Companies" }, 500);
//     }
//   }

//   async getCompanyById(c: Context) {
//     try {
//       const { prismaClient, authId } = getTenantPrismaFromContext(c);
//       const { id } = c.req.param();
//       const company = await this.companiesService.getCompanyById(prismaClient, authId, id);

//       if (!company) {
//         return c.json({ message: "Company not found" }, 404);
//       }

//       return c.json({ message: "Company fetched successfully", data: company }, 200);
//     } catch (error) {
//       return c.json({ message: "Error fetching Company" }, 500);
//     }
//   }

//   async updateCompany(c: Context) {
//     try {
//       const { prismaClient, authId } = getTenantPrismaFromContext(c);
//       const body = await c.req.json();
//       const validated = updateCompanySchema.safeParse(body);

//       if (!validated.success) {
//         return c.json({ error: z.treeifyError(validated.error) }, 400);
//       }

//       const company = await this.companiesService.updateCompany(
//         prismaClient,
//         authId,
//         validated.data,
//       );

//       if (!company) {
//         return c.json({ message: "Company not found" }, 404);
//       }

//       log.info(`Company updated successfully: ${company.id}`);

//       return c.json({ message: "Company updated successfully", data: company }, 200);
//     } catch (error) {
//       return c.json({ message: "Error updating Company" }, 500);
//     }
//   }
// }
