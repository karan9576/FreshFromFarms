const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

// In-memory data stores for rate tracking
const authIpStore = new Map();
const authAccountStore = new Map();
const publicStore = new Map();
const authedStore = new Map();

// Helper to parse env configs dynamically with fallbacks
const getConfig = () => ({
  authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000,
  authMaxIp: parseInt(process.env.RATE_LIMIT_AUTH_MAX_IP, 10) || 10,
  authMaxAccount: parseInt(process.env.RATE_LIMIT_AUTH_MAX_ACCOUNT, 10) || 5,
  authBackoffBaseSec: parseInt(process.env.RATE_LIMIT_AUTH_BACKOFF_BASE_SEC, 10) || 5,
  authBackoffMaxSec: parseInt(process.env.RATE_LIMIT_AUTH_BACKOFF_MAX_SEC, 10) || 900,

  publicWindowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS, 10) || 15 * 60 * 1000,
  publicMax: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX, 10) || 100,

  authedWindowMs: parseInt(process.env.RATE_LIMIT_AUTHED_WINDOW_MS, 10) || 15 * 60 * 1000,
  authedMax: parseInt(process.env.RATE_LIMIT_AUTHED_MAX, 10) || 300,
});

/**
 * Cleanup expired entries periodically (every 15 minutes)
 */
setInterval(() => {
  const now = Date.now();
  const config = getConfig();

  for (const [key, entry] of authIpStore.entries()) {
    if (now - entry.lastAttempt > config.authWindowMs) authIpStore.delete(key);
  }
  for (const [key, entry] of authAccountStore.entries()) {
    if (now - entry.lastAttempt > config.authWindowMs) authAccountStore.delete(key);
  }
  for (const [key, entry] of publicStore.entries()) {
    if (now - entry.startTime > config.publicWindowMs) publicStore.delete(key);
  }
  for (const [key, entry] of authedStore.entries()) {
    if (now - entry.startTime > config.authedWindowMs) authedStore.delete(key);
  }
}, 15 * 60 * 1000);

/**
 * 1. Authentication Rate Limiter with Per-IP + Per-Account tracking & Exponential Backoff
 */
const authRateLimiter = (req, res, next) => {
  const config = getConfig();
  const now = Date.now();
  const ip = getClientIp(req);
  const accountEmail = req.body?.email || req.body?.userEmail || null;
  const normalizedAccount = accountEmail ? String(accountEmail).toLowerCase().trim() : null;

  // Retrieve or initialize IP record
  let ipRecord = authIpStore.get(ip) || { count: 0, lastAttempt: now };
  if (now - ipRecord.lastAttempt > config.authWindowMs) {
    ipRecord = { count: 0, lastAttempt: now };
  }

  // Retrieve or initialize Account record
  let accountRecord = normalizedAccount ? (authAccountStore.get(normalizedAccount) || { count: 0, lastAttempt: now }) : null;
  if (accountRecord && now - accountRecord.lastAttempt > config.authWindowMs) {
    accountRecord = { count: 0, lastAttempt: now };
  }

  // Calculate excesses beyond threshold
  const ipExcess = Math.max(0, ipRecord.count - config.authMaxIp + 1);
  const accountExcess = accountRecord ? Math.max(0, accountRecord.count - config.authMaxAccount + 1) : 0;
  const maxExcess = Math.max(ipExcess, accountExcess);

  // If excess attempts occurred, enforce exponential backoff delay
  if (maxExcess > 0) {
    const delaySec = Math.min(
      config.authBackoffMaxSec,
      Math.round(config.authBackoffBaseSec * Math.pow(2, maxExcess - 1))
    );

    const timeSinceLastAttemptSec = Math.floor((now - Math.max(ipRecord.lastAttempt, accountRecord?.lastAttempt || 0)) / 1000);
    const remainingWaitSec = delaySec - timeSinceLastAttemptSec;

    if (remainingWaitSec > 0) {
      res.setHeader('Retry-After', remainingWaitSec);
      res.setHeader('X-RateLimit-Limit-IP', config.authMaxIp);
      res.setHeader('X-RateLimit-Limit-Account', config.authMaxAccount);
      
      return res.status(429).json({
        message: `Too many authentication attempts. Please try again in ${remainingWaitSec} second${remainingWaitSec > 1 ? 's' : ''}.`,
        retryAfter: remainingWaitSec
      });
    }
  }

  // Record attempt count on request execution
  ipRecord.count += 1;
  ipRecord.lastAttempt = now;
  authIpStore.set(ip, ipRecord);

  if (normalizedAccount && accountRecord) {
    accountRecord.count += 1;
    accountRecord.lastAttempt = now;
    authAccountStore.set(normalizedAccount, accountRecord);
  }

  next();
};

/**
 * Helper function to reset authentication attempt counts on success
 */
const resetAuthAttempt = (req, email) => {
  const ip = getClientIp(req);
  authIpStore.delete(ip);

  const accountEmail = email || req.body?.email || req.body?.userEmail;
  if (accountEmail) {
    const normalizedAccount = String(accountEmail).toLowerCase().trim();
    authAccountStore.delete(normalizedAccount);
  }
};

/**
 * 2. Public Endpoints Rate Limiter (Moderate sliding window per IP)
 */
const publicRateLimiter = (req, res, next) => {
  const config = getConfig();
  const now = Date.now();
  const ip = getClientIp(req);

  let record = publicStore.get(ip);

  if (!record || now - record.startTime > config.publicWindowMs) {
    record = { count: 1, startTime: now };
    publicStore.set(ip, record);
  } else {
    record.count += 1;
  }

  res.setHeader('X-RateLimit-Limit', config.publicMax);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.publicMax - record.count));

  if (record.count > config.publicMax) {
    const resetTimeSec = Math.ceil((record.startTime + config.publicWindowMs - now) / 1000);
    res.setHeader('Retry-After', resetTimeSec);
    return res.status(429).json({
      message: 'Too many requests on public endpoints. Please slow down and try again shortly.',
      retryAfter: resetTimeSec
    });
  }

  next();
};

/**
 * 3. Authenticated Actions Rate Limiter (Looser sliding window per User ID or IP)
 */
const authedRateLimiter = (req, res, next) => {
  const config = getConfig();
  const now = Date.now();
  const key = req.user?._id ? `user_${req.user._id}` : `ip_${getClientIp(req)}`;

  let record = authedStore.get(key);

  if (!record || now - record.startTime > config.authedWindowMs) {
    record = { count: 1, startTime: now };
    authedStore.set(key, record);
  } else {
    record.count += 1;
  }

  res.setHeader('X-RateLimit-Limit', config.authedMax);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.authedMax - record.count));

  if (record.count > config.authedMax) {
    const resetTimeSec = Math.ceil((record.startTime + config.authedWindowMs - now) / 1000);
    res.setHeader('Retry-After', resetTimeSec);
    return res.status(429).json({
      message: 'Rate limit exceeded for user actions. Please try again shortly.',
      retryAfter: resetTimeSec
    });
  }

  next();
};

module.exports = {
  authRateLimiter,
  publicRateLimiter,
  authedRateLimiter,
  resetAuthAttempt
};
