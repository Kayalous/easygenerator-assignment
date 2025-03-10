import { createLogger, format, transports } from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const logDir = join(__dirname, '../../logs');

// Ensure logs directory exists
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

const formatMetadata = (info: Record<string, unknown>): string => {
  const metadata = { ...info };
  delete metadata.timestamp;
  delete metadata.level;
  delete metadata.message;
  delete metadata.stack;

  return Object.keys(metadata).length
    ? `\n${JSON.stringify(metadata, null, 2)}`
    : '';
};

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
        format.printf((info) => {
          const { timestamp, level, message } = info;
          const meta = formatMetadata(info);
          return `${String(timestamp)} ${String(level)}: ${String(message)}${meta}`;
        }),
      ),
    }),
    // Write all logs to app.log
    new transports.File({
      filename: join(logDir, 'app.log'),
      format: format.combine(
        format.printf((info) => {
          const { timestamp, level, message, stack } = info;
          const meta = formatMetadata(info);
          const stackTrace = typeof stack === 'string' ? `\n${stack}` : '';
          return `${String(timestamp)} ${String(level)}: ${String(message)}${meta}${stackTrace}`;
        }),
      ),
    }),
  ],
});
