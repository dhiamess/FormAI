import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Middleware global de gestion des erreurs
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Erreur Mongoose de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: err.message,
    });
  }

  // Erreur Mongoose de duplication
  if (err.name === 'MongoServerError' && (err as Record<string, unknown>).code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Cette ressource existe déjà',
    });
  }

  logger.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
  });
}
