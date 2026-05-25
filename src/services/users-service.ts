import { PrismaClient, Users } from "../generated/prisma/client";
import {
  CreateCompanyUserInput,
  CreateUserInput,
  InviteUserInput,
} from "../validators/users.schema";
import { getWorkOSClient } from "../lib/workos-client";
import { log } from "../utils/logger";

export class UsersService {
  private workosClient = getWorkOSClient();

  private async resolveUserId(prisma: PrismaClient, authId: string) {
    const user = await prisma.users.findUnique({
      where: { authId },
      select: { id: true },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user.id;
  }

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

  /**
   * Invites a user to the organization and creates a new user record and adds them as a venueUser with specific role
   */
  async inviteUser(
    prisma: PrismaClient,
    data: InviteUserInput,
    organizationId: string,
    authId: string,
  ) {
    try {
      // const invitation = await this.workosClient.userManagement.sendInvitation({
      //   email: data.email,
      //   organizationId: organizationId,
      //   inviterUserId: authId,
      // });

      // if (!invitation.id) {
      //   throw new Error("WorkOS invitation failed");
      // }
      console.log(data);

      const userData: CreateUserInput = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        invitationId: "UUID4",
        // status: "invited",
      };

      const createdUser = await this.createUser(prisma, userData, authId);

      // returns the user-id of the user using this endpoint.
      // const invitedByUserId = await this.resolveUserId(prisma, authId);

      // if (data.companyId) {
      //   const companyUserData: CreateCompanyUserInput = {
      //     companyId: data.companyId,
      //     userId: createdUser.id,
      //     companyRoleId: data.companyRoleId ?? "",
      //     invitedByUserId: invitedByUserId,
      //   };
      //   await this.createCompanyUser(prisma, companyUserData, invitedByUserId);
      // } else if (data.venueId) {
      // }

      return { message: "OK", data: createdUser };
    } catch (error) {
      if (
        error instanceof Error &&
        (error as any).rawData.code === "email_already_invited_to_organization"
      ) {
        log.error("User already invited to organization.", error);
        throw new Error("User already invited to organization.");
      }
      throw error;
    }
  }

  async createCompanyUser(prisma: PrismaClient, data: CreateCompanyUserInput, authId: string) {
    // TODO: Check if user has permissions to create company user.

    return prisma.companyUsers.create({
      data: {
        ...data,
      },
    });
  }
}
