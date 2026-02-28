import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';

/**
 * GET /api/users — Lister les utilisateurs de l'organisation
 */
export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { page = 1, limit = 20 } = req.query;

    const filter = { organization: user.organization };
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('groups', 'name'),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users — Créer un utilisateur
 */
export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminUser = req.user!;
    const newUser = await User.create({
      ...req.body,
      passwordHash: req.body.password,
      organization: adminUser.organization,
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Utilisateur créé',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/:id — Modifier un utilisateur
 */
export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { password, ...updateData } = req.body;
    const updateObj: Record<string, unknown> = { ...updateData };

    if (password) {
      updateObj.passwordHash = password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true, runValidators: true },
    ).select('-passwordHash');

    if (!updatedUser) throw new NotFoundError('Utilisateur');

    res.json({
      success: true,
      data: updatedUser,
      message: 'Utilisateur mis à jour',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id — Désactiver un utilisateur
 */
export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!user) throw new NotFoundError('Utilisateur');

    res.json({
      success: true,
      message: 'Utilisateur désactivé',
    });
  } catch (error) {
    next(error);
  }
}
