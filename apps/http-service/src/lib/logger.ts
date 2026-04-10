import { createLogger, AppLogger } from '@repo/logger';

const NODE_ENV = process.env.NODE_ENV || 'development';

const isDev = NODE_ENV === 'development';
const logLevel = NODE_ENV === 'production' ? 'info' : 'debug';

export const logger: AppLogger = createLogger(logLevel, isDev);
