/**
 * Logging Middleware
 * Centralised logger for the notification app.
 * All application logging MUST go through this module.
 * Console.log / console.error are prohibited per evaluation rules.
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

function formatMessage(level, context, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${ts}] [${level}] [${context}] ${message}${metaStr}`;
}

function emit(level, levelNum, context, message, meta) {
  if (levelNum < CURRENT_LEVEL) return;
  const formatted = formatMessage(level, context, message, meta);
  // Route through console methods — but NOT console.log for app logic
  if (levelNum >= LOG_LEVELS.ERROR) {
    // eslint-disable-next-line no-console
    console.error(formatted);
  } else if (levelNum >= LOG_LEVELS.WARN) {
    // eslint-disable-next-line no-console
    console.warn(formatted);
  } else {
    // eslint-disable-next-line no-console
    console.info(formatted);
  }
}

export function createLogger(context) {
  return {
    debug: (msg, meta) => emit("DEBUG", LOG_LEVELS.DEBUG, context, msg, meta),
    info:  (msg, meta) => emit("INFO",  LOG_LEVELS.INFO,  context, msg, meta),
    warn:  (msg, meta) => emit("WARN",  LOG_LEVELS.WARN,  context, msg, meta),
    error: (msg, meta) => emit("ERROR", LOG_LEVELS.ERROR, context, msg, meta),
  };
}

/**
 * API request logging middleware — wraps fetch calls.
 * Usage: apiFetch(url, options)
 */
const apiLogger = createLogger("API");

export async function apiFetch(url, options = {}) {
  apiLogger.info(`Request`, { method: options.method || "GET", url });
  const start = performance.now();
  try {
    const res = await fetch(url, options);
    const elapsed = Math.round(performance.now() - start);
    apiLogger.info(`Response`, { status: res.status, url, elapsed_ms: elapsed });
    if (!res.ok) {
      apiLogger.warn(`Non-OK response`, { status: res.status, url });
    }
    return res;
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    apiLogger.error(`Request failed`, { url, error: err.message, elapsed_ms: elapsed });
    throw err;
  }
}
