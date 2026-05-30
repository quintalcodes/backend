import { PrismaClient, UserStatus, Users, VenueUserStatus } from "../generated/prisma/client";
import {
  CreateCompanyUserInput,
  CreateVenueUserInput,
  CreateUserInput,
  InviteUserInput,
  UpdateVenueUserInput,
} from "../validators/users.schema";
import { getWorkOSClient } from "../lib/workos-client";
import { log } from "../utils/logger";
import { WorkOS } from "@workos-inc/node";

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
    let workosUser: Awaited<ReturnType<WorkOS["userManagement"]["getUser"]>> | null = null;

    try {
      workosUser = await getWorkOSClient().userManagement.getUser(authId);
      console.log(workosUser);
    } catch (error) {
      // TODO: use sentry IO for this one.
      console.error(error, "Failed to get workos user from WorkOS");
    }

    const user = await prisma.users.findUnique({
      where: {
        email: workosUser?.email,
      },
    });

    // TODO: Throw extra conditions based on workOS status here.

    if (!user?.authId && user?.status === UserStatus.invited) {
      if (workosUser) {
        await prisma.users.update({
          where: {
            email: workosUser.email,
          },
          data: {
            authId: workosUser.id,
            status: UserStatus.active,
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
    }

    const currentUser = await prisma.users.findUnique({
      where: {
        authId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userPhotoUrl: true,
        venueUsers: {
          select: {
            companyId: true,
            venueId: true,
          },
        },
      },
    });

    if (!currentUser) {
      return null;
    }

    const companiesMap = new Map<string, Set<string>>();

    for (const venueUser of currentUser.venueUsers) {
      if (!companiesMap.has(venueUser.companyId)) {
        companiesMap.set(venueUser.companyId, new Set<string>());
      }
      companiesMap.get(venueUser.companyId)?.add(venueUser.venueId);
    }

    const companies = Array.from(companiesMap.entries()).map(([id, venues]) => ({
      id,
      venues: Array.from(venues),
    }));

    return {
      id: currentUser.id,
      email: currentUser.email,
      firstname: currentUser.firstName,
      lastname: currentUser.lastName,
      userphotourl: currentUser.userPhotoUrl,
      companies,
    };
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

  async updateVenueUser(prisma: PrismaClient, data: UpdateVenueUserInput, authId: string) {
    // TODO: Check if user has permissions to update venue user.
    const { id, ...updates } = data;

    return prisma.venueUsers.update({
      where: { id },
      data: updates,
    });
  }
  async getVenueUsers(prisma: PrismaClient, venueId: string) {
    return prisma.venueUsers.findMany({
      where: { venueId },
      select: {
        userId: true,
        status: true,
        venueRole: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
  async getVenueUserRoles(prisma: PrismaClient) {
    return prisma.venueRoles.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }
}
