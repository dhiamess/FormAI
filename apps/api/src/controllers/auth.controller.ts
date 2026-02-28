import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/auth/register — Inscription
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, tokens } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: { user, ...tokens },
      message: 'Inscription réussie',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login — Connexion
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const { user, tokens } = await authService.login(email, password);

    res.json({
      success: true,
      data: { user, ...tokens },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh — Rafraîchir le token
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout — Déconnexion
 */
export async function logout(_req: Request, res: Response) {
  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
}

/**
 * GET /api/auth/me — Profil utilisateur courant
 */
export async function me(req: AuthRequest, res: Response) {
  res.json({
    success: true,
    data: req.user,
  });
}
