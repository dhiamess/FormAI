import { Response, NextFunction } from 'express';
import { Group } from '../models/Group';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';

/**
 * GET /api/groups — Lister les groupes
 */
export async function listGroups(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const groups = await Group.find({ organization: user.organization })
      .populate('members', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/groups — Créer un groupe
 */
export async function createGroup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const group = await Group.create({
      ...req.body,
      organization: user.organization,
    });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Groupe créé',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/groups/:id — Modifier les permissions d'un groupe
 */
export async function updateGroup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate('members', 'firstName lastName email');

    if (!group) throw new NotFoundError('Groupe');

    res.json({
      success: true,
      data: group,
      message: 'Groupe mis à jour',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/groups/:id — Supprimer un groupe
 */
export async function deleteGroup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) throw new NotFoundError('Groupe');

    res.json({
      success: true,
      message: 'Groupe supprimé',
    });
  } catch (error) {
    next(error);
  }
}
