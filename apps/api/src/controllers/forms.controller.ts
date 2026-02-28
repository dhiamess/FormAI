import { Response, NextFunction } from 'express';
import { formService } from '../services/form.service';
import { AuthRequest } from '../middleware/auth';
import { FormStatus } from '@formai/shared';

/**
 * GET /api/forms — Lister les formulaires
 */
export async function listForms(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { page, limit, status, search } = req.query;

    const result = await formService.list(user.organization.toString(), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as FormStatus | undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: result.forms,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/forms — Créer un formulaire manuellement
 */
export async function createForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const form = await formService.create({
      ...req.body,
      organization: user.organization.toString(),
      createdBy: user._id.toString(),
    });

    res.status(201).json({
      success: true,
      data: form,
      message: 'Formulaire créé',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/forms/:id — Détails d'un formulaire
 */
export async function getForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const form = await formService.getById(req.params.id);

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/forms/:id — Modifier un formulaire
 */
export async function updateForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const form = await formService.update(req.params.id, {
      ...req.body,
      updatedBy: user._id.toString(),
    });

    res.json({
      success: true,
      data: form,
      message: 'Formulaire mis à jour',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/forms/:id — Supprimer un formulaire
 */
export async function deleteForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await formService.delete(req.params.id);

    res.json({
      success: true,
      message: 'Formulaire supprimé',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/forms/:id/publish — Publier un formulaire
 */
export async function publishForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const form = await formService.publish(req.params.id);

    res.json({
      success: true,
      data: form,
      message: 'Formulaire publié',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/forms/:id/archive — Archiver un formulaire
 */
export async function archiveForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const form = await formService.archive(req.params.id);

    res.json({
      success: true,
      data: form,
      message: 'Formulaire archivé',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/forms/:id/duplicate — Dupliquer un formulaire
 */
export async function duplicateForm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const form = await formService.duplicate(req.params.id, user._id.toString());

    res.status(201).json({
      success: true,
      data: form,
      message: 'Formulaire dupliqué',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/forms/:id/versions — Historique des versions
 */
export async function getVersions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const form = await formService.getById(req.params.id);

    res.json({
      success: true,
      data: form.versions,
    });
  } catch (error) {
    next(error);
  }
}
