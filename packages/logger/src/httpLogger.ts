import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'http';
import { createLogger } from './logger.js';
import type { LoggerLevel, CreateHttpLogger } from './types.js';

export const httpLogger: CreateHttpLogger = (level: LoggerLevel = 'info', isDev: boolean = false) =>
  pinoHttp({
    logger: createLogger(level, isDev),

    customLogLevel(_req: IncomingMessage, res: ServerResponse, err?: Error) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    customSuccessMessage(req: IncomingMessage, res: ServerResponse, _responseTime: number) {
      return `${req.method} ${req.url} — ${res.statusCode} response-time: ${_responseTime} ms`;
    },

    customErrorMessage(req: IncomingMessage, res: ServerResponse, err: Error) {
      return `${req.method} ${req.url} — ${res.statusCode} — ${err.message}`;
    },

    serializers: {
      req(req: IncomingMessage) {
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.socket?.remoteAddress,
        };
      },
      res(res: ServerResponse) {
        return { statusCode: res.statusCode };
      },
    },
  });
