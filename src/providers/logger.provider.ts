import {Provider} from '@loopback/core';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export class LoggerProvider implements Provider<winston.Logger> {
  private logger: winston.Logger;

  constructor() {
    // You can (and should) externalize this configuration
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        winston.format(info => {
          const msgSplits = (info.message as string).split(' - ');
          info.location = msgSplits.length > 2 ? msgSplits[0] : undefined;
          info.function = msgSplits.length > 2 ? msgSplits[1] : undefined;
          info.message = msgSplits.length > 2 ? msgSplits[2] : info.message;
          return info;
        })(),
        winston.format.json(),
      ),
      transports: [
        // Daily rotate error logs
        new (winston.transports as any).DailyRotateFile({
          dirname: './logs',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        // Daily rotate combined logs
        new (winston.transports as any).DailyRotateFile({
          dirname: './logs',
          filename: 'combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });

    //
    // If we're not in production, also log to the `console`
    //
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      );
    }
  }

  // This is the function that LoopBack will call
  value(): winston.Logger {
    return this.logger;
  }
}
