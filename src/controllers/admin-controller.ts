import { Context } from "hono";
import { log } from "../utils/logger";
import { CreateTenantInput } from "../validators/tenant.schema";
import { adminService } from "../services/admin-service";
import { z } from "zod";

class AdminController {
  private adminService = adminService;

  async createTenant(c: Context) {
    try {
      const body = await c.req.json();

      const validated = CreateTenantInput.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const tenant = await this.adminService.createTenant(validated.data);

      return c.json({ message: "Tenant created successfully", data: tenant }, 201);
    } catch (error) {
      log.error("Error creating tenant.", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
  async listTenants(c: Context) {
    try {
      const tenants = await this.adminService.listTenants();
      return c.json({ message: "Tenants listed successfully", data: tenants }, 200);
    } catch (error) {
      log.error("Error listing tenants.", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
}

export const adminController = new AdminController();
