import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUserDocument } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

/**
 * Middleware d'authentification JWT
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).populate('groups');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Utilisateur non trouvé ou désactivé' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
}

/**
 * Middleware optionnel — attache l'utilisateur s'il est connecté, mais ne bloque pas
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId).populate('groups');
      if (user?.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Pas de token ou token invalide — on continue sans user
  }
  next();
}
