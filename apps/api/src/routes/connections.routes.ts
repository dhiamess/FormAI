import { Router } from 'express';
import * as connectionsController from '../controllers/connections.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

router.get('/', authenticate, requirePermission('settings.manage'), connectionsController.listConnections);
router.post('/', authenticate, requirePermission('settings.manage'), connectionsController.createConnection);
router.post('/:id/test', authenticate, requirePermission('settings.manage'), connectionsController.testConnection);
router.delete('/:id', authenticate, requirePermission('settings.manage'), connectionsController.deleteConnection);

export default router;
