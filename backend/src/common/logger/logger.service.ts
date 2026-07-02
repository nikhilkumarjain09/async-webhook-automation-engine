import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private winstonLogger: WinstonLogger;
  private context = 'App';

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      isProduction ? format.json() : this.getDevFormat(),
    );

    this.winstonLogger = createLogger({
      level: isProduction ? 'info' : 'debug',
      format: logFormat,
      transports: [
        new transports.Console({
          silent: process.env.NODE_ENV === 'test',
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      const { message: msg, ...meta } = message;
      this.winstonLogger.info(msg || '', { context: ctx, ...meta });
    } else {
      this.winstonLogger.info(message, { context: ctx });
    }
  }

  error(message: any, trace?: string, context?: string) {
    const ctx = context || this.context;
    if (message instanceof Error) {
      this.winstonLogger.error(message.message, {
        context: ctx,
        stack: message.stack,
      });
    } else if (typeof message === 'object') {
      const { message: msg, ...meta } = message;
      this.winstonLogger.error(msg || '', {
        context: ctx,
        stack: trace || meta.stack,
        ...meta,
      });
    } else {
      this.winstonLogger.error(message, { context: ctx, stack: trace });
    }
  }

  warn(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      const { message: msg, ...meta } = message;
      this.winstonLogger.warn(msg || '', { context: ctx, ...meta });
    } else {
      this.winstonLogger.warn(message, { context: ctx });
    }
  }

  debug(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      const { message: msg, ...meta } = message;
      this.winstonLogger.debug(msg || '', { context: ctx, ...meta });
    } else {
      this.winstonLogger.debug(message, { context: ctx });
    }
  }

  verbose(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      const { message: msg, ...meta } = message;
      this.winstonLogger.verbose(msg || '', { context: ctx, ...meta });
    } else {
      this.winstonLogger.verbose(message, { context: ctx });
    }
  }

  private getDevFormat() {
    return format.combine(
      format.colorize({ all: true }),
      format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
        const contextStr = context ? ` \x1b[33m[${context}]\x1b[0m` : '';
        const metaStr = Object.keys(meta).length ? ` \n\x1b[90m${JSON.stringify(meta, null, 2)}\x1b[0m` : '';
        const stackStr = stack ? ` \n\x1b[31m${stack}\x1b[0m` : '';
        return `[Nest] - ${timestamp} ${level}:${contextStr} ${message}${metaStr}${stackStr}`;
      }),
    );
  }
}
