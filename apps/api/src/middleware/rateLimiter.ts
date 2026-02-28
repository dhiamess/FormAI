import rateLimit from 'express-rate-limit';

/**
 * Rate limiter pour les endpoints d'authentification
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les appels IA
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, error: 'Trop de requêtes IA. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter général pour l'API
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
