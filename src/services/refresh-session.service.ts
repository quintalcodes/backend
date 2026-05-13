import { getRegistryPrisma } from "../lib/registry-client";
import {
  getRefreshTokenExpiryDate,
} from "../utils/refresh-cookie-config";
import { generateRefreshToken, hashToken } from "../utils/refresh-token";

type SessionIdentity = {
  workosUserId: string;
  organizationId: string;
};

export class RefreshSessionService {
  async createSession(identity: SessionIdentity) {
    const plainToken = generateRefreshToken();
    const tokenHash = hashToken(plainToken);

    await getRegistryPrisma().refreshSession.create({
      data: {
        tokenHash,
        workosUserId: identity.workosUserId,
        organizationId: identity.organizationId,
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });

    return { plainToken };
  }

  async rotateSession(plainToken: string) {
    const currentHash = hashToken(plainToken);
    const session = await getRegistryPrisma().refreshSession.findUnique({
      where: { tokenHash: currentHash },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const nextPlainToken = generateRefreshToken();
    const nextHash = hashToken(nextPlainToken);

    await getRegistryPrisma().refreshSession.update({
      where: { tokenHash: currentHash },
      data: {
        tokenHash: nextHash,
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });

    return {
      nextPlainToken,
      workosUserId: session.workosUserId,
      organizationId: session.organizationId,
    };
  }

  async revokeSession(plainToken: string) {
    await getRegistryPrisma().refreshSession.deleteMany({
      where: { tokenHash: hashToken(plainToken) },
    });
  }
}
