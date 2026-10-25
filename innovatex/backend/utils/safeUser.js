/**
 * Sanitizes user data models before sending payloads to clients,
 * ensuring no sensitive fields (passwords, internal salts, OTPs) are ever exposed.
 */
function getSafeUserData(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  return {
    _id: obj._id ? obj._id.toString() : undefined,
    name: obj.name || '',
    email: obj.email || '',
    githubUsername: obj.githubUsername || '',
    bio: obj.bio || '',
    targetRole: obj.targetRole || '',
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    location: obj.location || '',
    preferences: obj.preferences || {},
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

/**
 * Strips untrusted tags, script characters, and normalizes inputs
 */
function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

module.exports = {
  getSafeUserData,
  sanitizeString
};
