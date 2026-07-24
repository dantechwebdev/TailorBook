/**
 * logger.ts — Minimal structured logger for TailorBook services.
 * In development: outputs to console with module prefix.
 * In production: swallowable (can redirect to crash reporting later).
 */

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export function createLogger(module: string): Logger {
  const prefix = `[${module}]`;

  return {
    info(message: string, ...args: unknown[]) {
      if (__DEV__) console.info(prefix, message, ...args);
    },
    warn(message: string, ...args: unknown[]) {
      console.warn(prefix, message, ...args);
    },
    error(message: string, ...args: unknown[]) {
      console.error(prefix, message, ...args);
    },
    debug(message: string, ...args: unknown[]) {
      if (__DEV__) console.log(prefix, message, ...args);
    },
  };
}
