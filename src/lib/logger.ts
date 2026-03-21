type LogLevel = "info" | "warn" | "error" | "debug";

const ansiColors: Record<LogLevel, string> = {
  info: "\x1b[34m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[35m",
};

const browserColors: Record<LogLevel, string> = {
  info: "#2563eb",
  warn: "#d97706",
  error: "#dc2626",
  debug: "#7c3aed",
};

const resetAnsi = "\x1b[0m";

const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
const hasProcess = typeof process !== "undefined";
const supportsAnsi = !isBrowser && hasProcess && !!process.stdout?.isTTY && process.env.NO_COLOR !== "1";

function getConsoleMethod(level: LogLevel) {
  switch (level) {
    case "warn":
      return console.warn;
    case "error":
      return console.error;
    case "debug":
      return console.debug;
    default:
      return console.info;
  }
}

function formatLabel(level: LogLevel) {
  return level.toUpperCase().padEnd(5, " ");
}

function buildPrefix(scope?: string) {
  if (!scope) {
    return "";
  }
  return `[${scope}]`;
}

function log(level: LogLevel, scope: string | undefined, message: string, ...args: unknown[]) {
  const method = getConsoleMethod(level);
  const label = `[${formatLabel(level)}]`;
  const prefix = buildPrefix(scope);

  if (isBrowser) {
    const color = browserColors[level];
    if (prefix) {
      method(`%c${label}%c ${prefix} ${message}`, `color: ${color}; font-weight: 600;`, "color: inherit;", ...args);
    } else {
      method(`%c${label}%c ${message}`, `color: ${color}; font-weight: 600;`, "color: inherit;", ...args);
    }
    return;
  }

  if (supportsAnsi) {
    const color = ansiColors[level];
    const coloredLabel = `${color}${label}${resetAnsi}`;
    if (prefix) {
      method(`${coloredLabel} ${prefix} ${message}`, ...args);
    } else {
      method(`${coloredLabel} ${message}`, ...args);
    }
    return;
  }

  if (prefix) {
    method(`${label} ${prefix} ${message}`, ...args);
  } else {
    method(`${label} ${message}`, ...args);
  }
}

export function createLogger(scope?: string) {
  return {
    info: (message: string, ...args: unknown[]) => log("info", scope, message, ...args),
    warn: (message: string, ...args: unknown[]) => log("warn", scope, message, ...args),
    error: (message: string, ...args: unknown[]) => log("error", scope, message, ...args),
    debug: (message: string, ...args: unknown[]) => log("debug", scope, message, ...args),
  };
}
