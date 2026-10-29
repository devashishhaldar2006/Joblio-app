// Environment configuration for Joblio Mobile client
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_live_Y2xlcmsuam9ibGlvLmhhY2tjZW50cmFsLm1lJA';

const base64Decode = (str: string): string => {
  if (typeof atob === 'function') {
    return atob(str);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = String(str).replace(/=+$/, '');
  for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ) {
    const charIndex = chars.indexOf(buffer);
    if (~charIndex) {
      bs = bc % 4 ? bs * 64 + charIndex : charIndex;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
  }
  return output;
};

export const getClerkFrontendApi = (): string => {
  const envApi = process.env.EXPO_PUBLIC_CLERK_FRONTEND_API;
  if (envApi) return envApi.replace(/\/+$/, '');

  try {
    // Standard Clerk key: pk_test_<base64_encoded_domain>$
    const key = CLERK_PUBLISHABLE_KEY.trim();
    const parts = key.split('_');
    if (parts.length >= 3) {
      let b64 = parts[2];
      // Strip trailing dollar sign if present in key format
      if (b64.endsWith('$')) {
        b64 = b64.slice(0, -1);
      }
      const decoded = base64Decode(b64);
      // Clean up any trailing non-domain characters (like stray '$' or control chars)
      const cleanDomain = decoded.replace(/[^a-zA-Z0-9.-]/g, '').trim();
      if (cleanDomain && cleanDomain.includes('.')) {
        return `https://${cleanDomain}`;
      }
    }
  } catch (e) {
    // Fallback if decoding error
  }
  return 'https://clerk.joblio.hackcentral.me';
};

