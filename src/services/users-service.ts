import { PrismaClient, Users } from "../generated/prisma/client";
import { CreateUserInput, InviteUserInput } from "../validators/users.schema";
import { getWorkOSClient } from "../lib/workos-client";
import { Context } from "hono";

export class UsersService {
  private workosClient = getWorkOSClient();

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

  async inviteUser(
    prisma: PrismaClient,
    data: InviteUserInput,
    organizationId: string,
    authId: string,
  ) {
    try {
      // invite the user to the organization:
      const invitation = await this.workosClient.userManagement.sendInvitation({
        email: data.email,
        organizationId: organizationId,
        inviterUserId: authId,
      });

      console.log(organizationId);
      console.log(invitation);
      return { message: "OK" };
    } catch (error) {}
  }
}
