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
      orderBy: { createdAt: "desc" },
    });
  }

  async updateCompany(prisma: PrismaClient, authId: string, data: UpdateCompanyInput) {
    return prisma.companies.update({
      where: { id: data.id },
      data: data,
    });
  }

  async deleteCompany(prisma: PrismaClient, authId: string, id: string) {
    return prisma.companies.update({
      where: { id: id },
      data: {
        status: "archived",
      },
    });
  }

  async getCompanyById(prisma: PrismaClient, authId: string, id: string) {
    return prisma.companies.findUnique({
      where: { id: id },
    });
  }
}
