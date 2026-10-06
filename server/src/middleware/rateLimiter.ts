import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const aiMaxRequests = parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '20', 10);

export const standardRateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Please wait before making more requests.',
  },
});

export const aiRateLimiter = rateLimit({
  windowMs,
  max: aiMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI analysis rate limit exceeded. Please wait before requesting another page scan.',
  },
});
