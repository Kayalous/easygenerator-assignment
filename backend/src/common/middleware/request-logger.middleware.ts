import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

interface SafeLogObject {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | SafeLogObject
    | SafeLogObject[];
}

// Fields that should be completely masked
const SENSITIVE_FIELDS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'passwordConfirmation',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'secret',
  'privateKey',
  'credit_card',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
]);

// Fields that should be partially masked (show only part of the data)
const PARTIAL_MASK_FIELDS = new Set([
  'email',
  'phone',
  'address',
  'birthDate',
  'dob',
]);

const maskValue = (value: string): string => '[FILTERED]';

const partialMaskValue = (value: string): string => {
  if (value.includes('@')) {
    // Email masking: show first 2 chars and domain
    const [localPart, domain] = value.split('@');
    return `${localPart.slice(0, 2)}***@${domain}`;
  }
  // For other values, show only first and last character
  if (value.length <= 4) return '****';
  return `${value.slice(0, 1)}***${value.slice(-1)}`;
};

const sanitizeLog = (obj: unknown, path: string[] = []): SafeLogObject => {
  if (typeof obj !== 'object' || obj === null) {
    const currentPath = path.join('.');
    const lastKey = path[path.length - 1]?.toLowerCase();

    if (lastKey && SENSITIVE_FIELDS.has(lastKey)) {
      return { value: maskValue(String(obj)) };
    }

    if (lastKey && PARTIAL_MASK_FIELDS.has(lastKey)) {
      return { value: partialMaskValue(String(obj)) };
    }

    return { value: String(obj) };
  }

  const sanitized: SafeLogObject = {};

  for (const [key, value] of Object.entries(obj)) {
    const newPath = [...path, key];

    if (value === null) {
      sanitized[key] = null;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => sanitizeLog(item, newPath));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeLog(value, newPath);
    } else {
      const keyLower = key.toLowerCase();
      if (SENSITIVE_FIELDS.has(keyLower)) {
        sanitized[key] = maskValue(String(value));
      } else if (PARTIAL_MASK_FIELDS.has(keyLower)) {
        sanitized[key] = partialMaskValue(String(value));
      } else {
        sanitized[key] = String(value);
      }
    }
  }

  return sanitized;
};

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Sanitize headers
    const headers = { ...req.headers };
    if (headers.authorization) {
      headers.authorization = maskValue(headers.authorization);
    }

    // Log request
    logger.info('Incoming request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? 'unknown',
      headers: sanitizeLog(headers),
      body: sanitizeLog(req.body),
      query: sanitizeLog(req.query),
      params: sanitizeLog(req.params),
    });

    // Log response after request is handled
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? 'unknown',
      });
    });

    next();
  }
}
