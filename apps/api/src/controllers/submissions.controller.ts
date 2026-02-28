import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submission.service';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/forms/:id/submissions — Soumettre un formulaire
 */
export async function createSubmission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const submission = await submissionService.create(req.params.id, {
      values: req.body.data,
      submittedBy: req.user?._id?.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      isTest: req.query.mode === 'test',
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Formulaire soumis avec succès',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/forms/:id/submissions — Lister les soumissions
 */
export async function listSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, status } = req.query;

    const result = await submissionService.list(req.params.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
    });

    res.json({
      success: true,
      data: result.submissions,
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
 * GET /api/forms/:id/submissions/:subId — Détails d'une soumission
 */
export async function getSubmission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const submission = await submissionService.getById(req.params.id, req.params.subId);

    res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/forms/:id/submissions/:subId — Modifier le statut
 */
export async function updateSubmission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const submission = await submissionService.updateStatus(
      req.params.id,
      req.params.subId,
      req.body.status,
    );

    res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/forms/:id/submissions/:subId — Supprimer une soumission
 */
export async function deleteSubmission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await submissionService.delete(req.params.id, req.params.subId);

    res.json({
      success: true,
      message: 'Soumission supprimée',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/forms/:id/submissions/export — Exporter en CSV
 */
export async function exportSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const csv = await submissionService.exportCSV(req.params.id);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${req.params.id}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
