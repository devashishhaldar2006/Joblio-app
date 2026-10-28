import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store (keyed by action:clientKey)
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
 * Returns current quota usage stats for a given client and resource.
 */
export function getQuotaStats(clientKey: string, actionName: string, maxPerDay: number) {
  const quotaKey = `${actionName}:${clientKey}`;
  const now = Date.now();
  const record = userQuotaStore.get(quotaKey);

  if (!record || now > record.resetAt) {
    return {
      used: 0,
      total: maxPerDay,
      remaining: maxPerDay,
      resetInHours: 24,
    };
  }

  const remaining = Math.max(0, maxPerDay - record.count);
  const resetInHours = Math.max(1, Math.ceil((record.resetAt - now) / (1000 * 60 * 60)));

  return {
    used: record.count,
    total: maxPerDay,
    remaining,
    resetInHours,
  };
}

/**
 * Creates fair-use rate limiting middleware for sensitive/expensive endpoints.
 * Injects X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers.
 * Returns structured 429 payload when exhausted.
 */
export const createDailyQuotaMiddleware = (maxPerDay: number, actionName: string = 'AI requests') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const clientKey = req.user?._id || req.ip || req.socket.remoteAddress || 'anonymous_user';
    const quotaKey = `${actionName}:${clientKey}`;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let record = userQuotaStore.get(quotaKey);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + oneDayMs,
      };
      userQuotaStore.set(quotaKey, record);

      res.setHeader('X-RateLimit-Limit', maxPerDay);
      res.setHeader('X-RateLimit-Remaining', maxPerDay - 1);
      res.setHeader('X-RateLimit-Reset-Hours', 24);
      return next();
    }

    if (record.count >= maxPerDay) {
      const hoursRemaining = Math.max(1, Math.ceil((record.resetAt - now) / (1000 * 60 * 60)));
      res.setHeader('X-RateLimit-Limit', maxPerDay);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset-Hours', hoursRemaining);

      return res.status(429).json({
        error: `Daily limit reached for ${actionName} (${maxPerDay}/${maxPerDay} used).`,
        message: `You've used all ${maxPerDay} of your daily ${actionName}. Your quota will replenish in ${hoursRemaining} hour(s).`,
        quotaExceeded: true,
        used: maxPerDay,
        total: maxPerDay,
        remaining: 0,
        resetInHours: hoursRemaining,
      });
    }

    record.count += 1;
    userQuotaStore.set(quotaKey, record);

    const remaining = maxPerDay - record.count;
    const hoursRemaining = Math.max(1, Math.ceil((record.resetAt - now) / (1000 * 60 * 60)));

    res.setHeader('X-RateLimit-Limit', maxPerDay);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset-Hours', hoursRemaining);

    return next();
  };
};

/**
 * Controller endpoint to retrieve a snapshot of all quota usages for the current user.
 */
export const getUserQuotas = (req: AuthenticatedRequest, res: Response) => {
  const clientKey = req.user?._id || req.ip || req.socket.remoteAddress || 'anonymous_user';

  const jobMatches = getQuotaStats(clientKey, 'Resume Job Matches', 15);
  const githubAudits = getQuotaStats(clientKey, 'GitHub Profile Audits', 10);
  const aiCodeGenerations = getQuotaStats(clientKey, 'AI Workflow & Readme Generations', 15);

  return res.status(200).json({
    jobMatches,
    githubAudits,
    aiCodeGenerations,
  });
};
