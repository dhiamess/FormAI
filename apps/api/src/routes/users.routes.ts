import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

router.get('/', authenticate, requirePermission('users.manage'), usersController.listUsers);
router.post('/', authenticate, requirePermission('users.manage'), usersController.createUser);
router.put('/:id', authenticate, requirePermission('users.manage'), usersController.updateUser);
router.delete('/:id', authenticate, requirePermission('users.manage'), usersController.deleteUser);

export default router;
