import { WorkOS } from "@workos-inc/node";

let workos: WorkOS | undefined;

export function getWorkOSClient() {
  if (workos) {
    return workos;
  }

  const apiKey = Bun.env.WORKOS_API_KEY;
  const clientId = Bun.env.WORKOS_CLIENT_ID;

  if (!apiKey) {
    throw new Error("WORKOS_API_KEY is required");
  }

  if (!clientId) {
    throw new Error("WORKOS_CLIENT_ID is required");
  }

  workos = new WorkOS({
    apiKey,
    clientId,
  });

  return workos;
}
