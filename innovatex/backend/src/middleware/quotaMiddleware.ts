import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store (keyed by userId or IP)
const userQuotaStore = new Map<string, RateLimitRecord>();

// Clean up stale quota records periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of userQuotaStore.entries()) {
    if (now > record.resetAt) {
      userQuotaStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Creates fair-use rate limiting middleware for sensitive/expensive endpoints.
 * @param maxPerDay Maximum allowed calls per 24 hours.
 * @param actionName Friendly description of the resource (e.g. 'Resume AI analyses').
 */
export const createDailyQuotaMiddleware = (maxPerDay: number, actionName: string = 'AI requests') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Key by user ID if logged in, fallback to client IP
    const clientKey = req.user?._id || req.ip || req.socket.remoteAddress || 'anonymous_user';
    const quotaKey = `${actionName}:${clientKey}`;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let record = userQuotaStore.get(quotaKey);

    if (!record || now > record.resetAt) {
      // First request or window expired: start new 24h cycle
      record = {
        count: 1,
        resetAt: now + oneDayMs,
      };
      userQuotaStore.set(quotaKey, record);
      return next();
    }

    if (record.count >= maxPerDay) {
      const hoursRemaining = Math.ceil((record.resetAt - now) / (1000 * 60 * 60));
      return res.status(429).json({
        error: `Daily limit reached for ${actionName} (${maxPerDay}/${maxPerDay} used). Limit resets in approximately ${hoursRemaining} hour(s).`,
        quotaExceeded: true,
        resetInHours: hoursRemaining,
      });
    }

    record.count += 1;
    userQuotaStore.set(quotaKey, record);
    return next();
  };
};

