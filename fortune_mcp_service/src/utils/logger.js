const DEBUG_ENABLED = process.env.DEBUG === 'true' || process.env.LOG_LEVEL === 'debug';

export const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => {
    if (DEBUG_ENABLED) {
      console.debug(...args);
    }
  }
};

export const isDebugEnabled = DEBUG_ENABLED;
