interface WorkOSUserResponse {
  id: string;
  email: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  lastSignInAt: string | null;
  locale: string | null;
  createdAt: string;
  updatedAt: string;
  externalId: string | null;
  metadata: any;
}

interface WorkOSAuthenticationResponse {
  user: WorkOSUserResponse;
  organizationId: string;
  accessToken: string;
  refreshToken: string;
  authenticationMethod: string;
}

interface WorkOSOrganizationResponse {
  object: "organization";
  id: string;
  name: string;
  allowProfilesOutsideOrganization: boolean;
  domains: [];
  createdAt: string;
  updatedAt: string;
  externalId: string | null;
  metadata: Record<string, unknown>;
}

type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};

export type {
  LoginResponse,
  WorkOSUserResponse,
  WorkOSAuthenticationResponse,
  WorkOSOrganizationResponse,
};
