import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const timezone = Bun.env.TIMEZONE;

if (!Bun.env.TZ) {
  process.env.TZ = timezone;
}

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export const log = {
  error: (message: string, ...args: unknown[]) => {
    logger.error({ ...args }, message);
  },
  warn: (message: string, ...args: unknown[]) => {
    logger.warn({ ...args }, message);
  },
  info: (message: string, ...args: unknown[]) => {
    logger.info({ ...args }, message);
  },
  debug: (message: string, ...args: unknown[]) => {
    logger.debug({ ...args }, message);
  },
  trace: (message: string, ...args: unknown[]) => {
    logger.trace({ ...args }, message);
  },
  fatal: (message: string, ...args: unknown[]) => {
    logger.fatal({ ...args }, message);
  },
};

export default logger;
