import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/express';
import User from '../models/User.js';

export interface AuthUserPayload {
  _id: string;
  name: string;
  email: string;
  clerkId: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload | null;
  auth?: any;
}

let clerkClientInstance: any = null;
function getClerkClient() {
  if (clerkClientInstance) return clerkClientInstance;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  if (!secretKey) {
    console.error('[Clerk Security] CLERK_SECRET_KEY is missing in backend environment.');
    return null;
  }
  try {
    clerkClientInstance = createClerkClient({ secretKey, publishableKey });
  } catch (e) {
    console.warn('[Clerk] Failed to initialize Clerk client:', e);
  }
  return clerkClientInstance;
}

async function verifyClerkToken(token: string): Promise<AuthUserPayload | null> {
  const clerk = getClerkClient();
  if (!clerk) return null;

  try {
    const verified = await clerk.verifyToken(token);
    if (!verified || !verified.sub) return null;

    const clerkId = verified.sub;
    let mongoUser = await User.findOne({ clerkId });

    if (!mongoUser) {
      try {
        const clerkUserData = await clerk.users.getUser(clerkId);
        const email = clerkUserData.emailAddresses?.[0]?.emailAddress || `${clerkId}@clerk.user`;
        const name = [clerkUserData.firstName, clerkUserData.lastName].filter(Boolean).join(' ') ||
                     clerkUserData.username ||
                     'Developer';
        const avatar = clerkUserData.imageUrl || '';

        // Detect auth provider from externalAccounts
        let detectedProvider: 'email' | 'google' | 'github' = 'email';
        let detectedGithubUsername = '';

        if (Array.isArray(clerkUserData.externalAccounts)) {
          for (const acc of clerkUserData.externalAccounts) {
            const providerStr = String(acc.provider || acc.verification?.strategy || '').toLowerCase();
            if (providerStr.includes('github')) {
              detectedProvider = 'github';
              detectedGithubUsername = acc.username || clerkUserData.username || '';
            } else if (providerStr.includes('google')) {
              detectedProvider = 'google';
            }
          }
        }

        // If user already existed prior to Clerk, link account by email
        mongoUser = await User.findOne({ email });
        if (mongoUser) {
          mongoUser.clerkId = clerkId;
          if (avatar && !mongoUser.avatar) mongoUser.avatar = avatar;
          if (detectedProvider !== 'email') mongoUser.authProvider = detectedProvider;
          if (detectedGithubUsername && !mongoUser.githubUsername) {
            mongoUser.githubUsername = detectedGithubUsername;
          }
          await mongoUser.save();
        } else {
          mongoUser = await User.create({
            name,
            email,
            clerkId,
            avatar,
            authProvider: detectedProvider,
            githubUsername: detectedGithubUsername,
            hasCompletedOnboarding: false,
            skills: ['TypeScript', 'React', 'Node.js'],
            targetRole: 'Software Engineer',
          });
        }
      } catch (userFetchErr) {
        mongoUser = await User.create({
          name: 'Developer',
          email: `${clerkId}@clerk.user`,
          clerkId,
          authProvider: 'email',
          hasCompletedOnboarding: false,
          skills: ['TypeScript', 'React'],
          targetRole: 'Software Engineer',
        });
      }
    }

    return {
      _id: mongoUser._id.toString(),
      name: mongoUser.name,
      email: mongoUser.email,
      clerkId: mongoUser.clerkId,
    };
  } catch (clerkErr) {
    return null;
  }
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No Clerk token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const clerkUser = await verifyClerkToken(token);
  if (!clerkUser) {
    return res.status(401).json({ error: 'Invalid or expired Clerk session token.' });
  }

  req.user = clerkUser;
  return next();
};

export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const clerkUser = await verifyClerkToken(token);
  req.user = clerkUser || null;
  return next();
};

export default authMiddleware;
