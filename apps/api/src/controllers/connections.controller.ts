import { Response, NextFunction } from 'express';
import { connectorService } from '../services/connector.service';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/connections — Lister les connexions
 */
export async function listConnections(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const connections = await connectorService.list(user.organization.toString());

    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/connections — Créer une connexion
 */
export async function createConnection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const connection = await connectorService.create({
      ...req.body,
      organization: user.organization.toString(),
      createdBy: user._id.toString(),
    });

    res.status(201).json({
      success: true,
      data: connection,
      message: 'Connexion créée',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/connections/:id/test — Tester une connexion
 */
export async function testConnection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const success = await connectorService.testConnection(req.params.id);

    res.json({
      success: true,
      data: { connected: success },
      message: success ? 'Connexion réussie' : 'Échec de la connexion',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/connections/:id — Supprimer une connexion
 */
export async function deleteConnection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await connectorService.delete(req.params.id);

    res.json({
      success: true,
      message: 'Connexion supprimée',
    });
  } catch (error) {
    next(error);
  }
}
