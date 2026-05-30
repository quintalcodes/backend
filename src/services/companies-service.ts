import { PrismaClient } from "../generated/prisma/client";
import { CreateCompanyInput, UpdateCompanyInput } from "../validators/company.schema";

export class CompaniesService {
  async createCompany(prisma: PrismaClient, authId: string, data: CreateCompanyInput) {
    return prisma.companies.create({
      data: data,
    });
  }

  async getCompanies(prisma: PrismaClient, authId: string) {
    return prisma.companies.findMany({
      where: {
        OR: [
          { companyUsers: { some: { user: { authId } } } },
          { venueUsers: { some: { user: { authId } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // TODO: only if user is a CompanyUser of the company..
  async updateCompany(prisma: PrismaClient, authId: string, data: UpdateCompanyInput) {
    return prisma.companies.update({
      where: { id: data.id },
      data: data,
    });
  }

  // TODO: only if user is a CompanyUser of the company..
  async deleteCompany(prisma: PrismaClient, authId: string, id: string) {
    return prisma.companies.update({
      where: { id: id },
      data: {
        status: "archived",
      },
    });
  }

  async getCompanyById(prisma: PrismaClient, authId: string, id: string) {
    return prisma.companies.findFirst({
      where: {
        id,
        OR: [
          { companyUsers: { some: { user: { authId } } } },
          { venueUsers: { some: { user: { authId } } } },
        ],
      },
    });
  }
}
