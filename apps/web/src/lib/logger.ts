/**
 * Centralized logging configuration.
 * Controls what gets logged to avoid terminal noise.
 */

const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LEVELS[LOG_LEVEL as LogLevel] ?? LEVELS.info;

/**
 * Structured logger that respects LOG_LEVEL environment variable.
 * 
 * Levels:
 * - debug: Detailed diagnostic info (DB queries, rule execution)
 * - info: Important events (decisions, payments, startup)
 * - warn: Something unexpected but not critical
 * - error: Errors that need attention
 * 
 * Set LOG_LEVEL=error in .env to silence routine logs.
 */
export const logger = {
  debug: (component: string, message: string, meta?: unknown) => {
    if (currentLevel <= LEVELS.debug) {
      console.log(`[${component}] ${message}`, meta ? meta : "");
    }
  },

  info: (component: string, message: string, meta?: unknown) => {
    if (currentLevel <= LEVELS.info) {
      console.log(`[${component}] ${message}`, meta ? meta : "");
    }
  },

  warn: (component: string, message: string, meta?: unknown) => {
    if (currentLevel <= LEVELS.warn) {
      console.warn(`[${component}] ${message}`, meta ? meta : "");
    }
  },

  error: (component: string, message: string, error?: unknown) => {
    if (currentLevel <= LEVELS.error) {
      console.error(`[${component}] ${message}`, error ? error : "");
    }
  },
};

/**
 * Silent logger for polling endpoints (balance, killswitch).
 * Only logs on errors or level changes.
 */
export const silentLog = {
  onlyErrors: (component: string, message: string, error?: unknown) => {
    if (currentLevel <= LEVELS.error) {
      console.error(`[${component}] ${message}`, error ? error : "");
    }
  },
};
