import { PrismaClient, Users, VenueUserStatus } from "../generated/prisma/client";
import {
  CreateCompanyUserInput,
  CreateVenueUserInput,
  CreateUserInput,
  InviteUserInput,
} from "../validators/users.schema";
import { getWorkOSClient } from "../lib/workos-client";
import { log } from "../utils/logger";

export class UsersService {
  private workosClient = getWorkOSClient();

  /**
   * Resolves the user id DB record from the auth id.
   */
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
   * Invites a user to the organization and creates a new user record and adds them as a venueUser with specific role.
   */
  async inviteUser(
    prisma: PrismaClient,
    data: InviteUserInput,
    organizationId: string,
    authId: string,
  ) {
    try {
      const invitedByUserId = await this.resolveUserId(prisma, authId);

      const invitation = await this.workosClient.userManagement.sendInvitation({
        email: data.email,
        organizationId: organizationId,
        inviterUserId: authId,
      });

      if (!invitation.id) {
        throw new Error("WorkOS invitation failed");
      }

      const userData: CreateUserInput = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        invitationId: invitation.id,
        status: "invited",
      };

      const createdUser = await this.createUser(prisma, userData, authId);

      const venueUserData: CreateVenueUserInput = {
        venueId: data.venueId,
        companyId: data.companyId as string,
        userId: createdUser.id,
        venueRoleId: data.venueRoleId,
        invitedByUserId: invitedByUserId,
      };

      await this.createVenueUser(prisma, venueUserData, invitedByUserId);

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

  async createVenueUser(prisma: PrismaClient, data: CreateVenueUserInput, authId: string) {
    // TODO: Check if user has permissions to create venue user.

    return prisma.venueUsers.create({
      data: data,
    });
  }
}
