import pino from 'pino';
import { CreateLogger, LoggerLevel } from './types.js';

export const createLogger: CreateLogger = (level: LoggerLevel = 'info', isDev: boolean = false) =>
  pino({
    level,
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
        },
      },
    }),
  });
