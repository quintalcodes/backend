import { PrismaClient } from "../generated/prisma/client";
import type { CreateAccountInput, UpdateAccountInput } from "../validators/account.schema";

export class AccountService {
  private async resolveUserId(prisma: PrismaClient, workosUserId: string) {
    const user = await prisma.user.findUnique({
      where: { workosUserId },
      select: { id: true },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user.id;
  }

  async createAccount(prisma: PrismaClient, workosUserId: string, data: CreateAccountInput) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    return prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
      },
    });
  }

  async getAccounts(prisma: PrismaClient) {
    return prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getAccountById(prisma: PrismaClient, id: string) {
    return prisma.account.findFirst({
      where: { id },
    });
  }

  async updateAccount(prisma: PrismaClient, workosUserId: string, data: UpdateAccountInput) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    const { id, ...rest } = data;
    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return null;
    }
    return prisma.account.update({
      where: { id },
      data: rest,
    });
  }

  async deleteAccount(prisma: PrismaClient, workosUserId: string, id: string) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return null;
    }
    return prisma.account.delete({
      where: { id },
    });
  }
}
