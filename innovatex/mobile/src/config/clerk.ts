// Environment configuration for Joblio Mobile client
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_c2F2ZWQtZ2F6ZWxsZS04NDgyLmNsZXJrLmFjY291bnRzLmRldiQ';

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
  if (envApi) return envApi;

  try {
    // Standard Clerk key: pk_test_<base64_encoded_domain>$
    const key = CLERK_PUBLISHABLE_KEY.trim();
    const parts = key.split('_');
    if (parts.length >= 3) {
      const b64 = parts[2].replace(/\$$/, '');
      const decoded = base64Decode(b64);
      if (decoded && decoded.includes('.')) {
        return `https://${decoded.trim()}`;
      }
    }
  } catch (e) {
    // Fallback if decoding error
  }
  return 'https://saved-gazelle-8482.clerk.accounts.dev';
};

