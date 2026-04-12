type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const envLevel = (process.env.LOG_LEVEL || "info") as LogLevel;
const threshold = LEVEL_PRIORITY[envLevel] ?? 1;
const isDev = process.env.NODE_ENV !== "production";

function shouldLog(level: LogLevel) {
  return LEVEL_PRIORITY[level] >= threshold;
}

function formatMessage(
  level: LogLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();

  if (isDev) {
    const prefix =
      level === "error"
        ? "❌"
        : level === "warn"
          ? "⚠️"
          : level === "info"
            ? "ℹ️"
            : "🔍";
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `${prefix} [${context}] ${message}${metaStr}`;
  }

  return JSON.stringify({
    timestamp,
    level,
    context,
    message,
    ...(meta ? { meta } : {}),
  });
}

function createLogger(context: string) {
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (shouldLog("debug")) console.debug(formatMessage("debug", context, message, meta));
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (shouldLog("info")) console.log(formatMessage("info", context, message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
      if (shouldLog("warn")) console.warn(formatMessage("warn", context, message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
      if (shouldLog("error")) console.error(formatMessage("error", context, message, meta));
    },
    child(subContext: string) {
      return createLogger(`${context}:${subContext}`);
    },
  };
}

export const log = createLogger("KRIYA");
export { createLogger };
export type { LogLevel };
