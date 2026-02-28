import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

router.get('/', authenticate, groupsController.listGroups);
router.post('/', authenticate, requirePermission('settings.manage'), groupsController.createGroup);
router.put('/:id', authenticate, requirePermission('settings.manage'), groupsController.updateGroup);
router.delete('/:id', authenticate, requirePermission('settings.manage'), groupsController.deleteGroup);

export default router;
