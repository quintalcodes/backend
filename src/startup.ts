import { getWorkOSClient } from "./lib/workos-client";
import { log } from "./utils/logger";
/**
 * Startup Checks
 */
try {
  getWorkOSClient();
} catch (error) {
  log.fatal(
    "WorkOS client failed to initialize. Check WORKOS_API_KEY and WORKOS_CLIENT_ID.",
    error,
  );
  process.exit(1);
}
