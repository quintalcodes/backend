import { PrismaClient, User } from "../generated/prisma/client";

export class UserService {
  async getCurrentUser(prisma: PrismaClient, workosUserId: string) {
    return prisma.user.findUnique({
      where: {
        workosUserId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        photoUrl: true,
      },
    });
  }
  async updateCurrentUser(prisma: PrismaClient, workosUserId: string, data: Partial<User>) {
    return prisma.user.update({
      where: {
        workosUserId,
      },
      data,
    });
  }
}
