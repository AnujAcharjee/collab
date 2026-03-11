import { type Logger, type LevelWithSilent } from 'pino';
import type { HttpLogger } from 'pino-http';

export type LoggerLevel = LevelWithSilent;
export type CreateLogger = (level?: LoggerLevel, isDev?: boolean) => Logger;
export type AppLogger = Logger;

export type CreateHttpLogger = (
  level?: LoggerLevel,
  isDev?: boolean
) => HttpLogger;
