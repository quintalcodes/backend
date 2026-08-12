import { z } from "zod";

export const CreateTenantInput = z.object({
  tenantDbName: z.string().min(1).toLowerCase().transform((val) => val.replace(/\s+/g, "_")),
  tenantName: z.string().min(1).toLowerCase(),
  tenantSubdomain: z.string().min(1).toLowerCase(),
  tenantOwnerEmail: z.email().toLowerCase(),
  tenantOwnerFirstName: z.string().min(1).toLowerCase(),
  tenantOwnerLastName: z.string().min(1).toLowerCase(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantInput>;
