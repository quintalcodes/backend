import { PrismaClient, Users } from "../generated/prisma/client";
import { CreateUserInput } from "../validators/users.schema";

export class UsersService {
  async getCurrentUser(prisma: PrismaClient, authId: string) {
    return prisma.users.findUnique({
      where: {
        authId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userPhotoUrl: true,
      },
    });
  }
  async updateCurrentUser(prisma: PrismaClient, authId: string, data: Partial<Users>) {
    return prisma.users.update({
      where: {
        authId,
      },
      data,
    });
  }

  async createUser(prisma: PrismaClient, data: CreateUserInput, authId: string) {
    // TODO: use AuthId to check if user has permissions to create user.
    return prisma.users.create({
      data,
    });
  }
}
