import { createLogger, format, transports } from 'winston';
import { join } from 'path';

const logDir = join(__dirname, '../../logs');

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Write all logs to console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),
    // Write all logs to app.log
    new transports.File({
      filename: join(logDir, 'app.log'),
      format: format.combine(
        format.printf(({ timestamp, level, message, stack }) => {
          const stackTrace = stack ? `\n${stack}` : '';
          return `${timestamp} ${level}: ${message}${stackTrace}`;
        }),
      ),
    }),
  ],
});
