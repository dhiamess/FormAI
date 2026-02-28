import { Router } from 'express';
import * as submissionsController from '../controllers/submissions.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// La soumission peut être publique (optionalAuth) si le formulaire est public
router.post('/:id/submissions', optionalAuth, submissionsController.createSubmission);

router.get('/:id/submissions', authenticate, requirePermission('submissions.read'), submissionsController.listSubmissions);
router.get('/:id/submissions/export', authenticate, requirePermission('submissions.export'), submissionsController.exportSubmissions);
router.get('/:id/submissions/:subId', authenticate, requirePermission('submissions.read'), submissionsController.getSubmission);
router.put('/:id/submissions/:subId', authenticate, requirePermission('submissions.read'), submissionsController.updateSubmission);
router.delete('/:id/submissions/:subId', authenticate, requirePermission('submissions.delete'), submissionsController.deleteSubmission);

export default router;
