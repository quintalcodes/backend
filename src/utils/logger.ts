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

function toLogObject(args: unknown[]) {
  if (args.length === 0) return {};

  const [first, ...rest] = args;
  if (first instanceof Error) {
    return {
      err: first,
      ...(rest.length > 0 ? { data: rest.length === 1 ? rest[0] : rest } : {}),
    };
  }

  if (args.length === 1 && typeof first === "object" && first !== null) {
    return first as Record<string, unknown>;
  }

  return { data: args.length === 1 ? first : args };
}

export const log = {
  error: (message: string, ...args: unknown[]) => {
    logger.error(toLogObject(args), message);
  },
  warn: (message: string, ...args: unknown[]) => {
    logger.warn(toLogObject(args), message);
  },
  info: (message: string, ...args: unknown[]) => {
    logger.info(toLogObject(args), message);
  },
  debug: (message: string, ...args: unknown[]) => {
    logger.debug(toLogObject(args), message);
  },
  trace: (message: string, ...args: unknown[]) => {
    logger.trace(toLogObject(args), message);
  },
  fatal: (message: string, ...args: unknown[]) => {
    logger.fatal(toLogObject(args), message);
  },
};

export default logger;
