import { describe, expect, test } from "bun:test";
import { AccountService } from "../../src/services/account-service";

describe("AccountService.createAccount", () => {
  test("creates an account for the resolved user", async () => {
    const service = new AccountService();

    const prisma = {
      user: {
        findUnique: async () => ({ id: "user_123" }),
      },
      account: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: "acc_123",
          ...data,
        }),
      },
    } as any;

    const result = await service.createAccount(prisma, "workos_user_123", {
      name: "Checking",
      type: "checking",
    });

    expect(result).toEqual({
      id: "acc_123",
      userId: "user_123",
      name: "Checking",
      type: "checking",
    });
  });
});
