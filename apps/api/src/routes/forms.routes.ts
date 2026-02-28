import { Router } from 'express';
import * as formsController from '../controllers/forms.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

router.get('/slug/:slug', formsController.getFormBySlug);
router.get('/', authenticate, requirePermission('forms.read'), formsController.listForms);
router.post('/', authenticate, requirePermission('forms.create'), formsController.createForm);
router.get('/:id', authenticate, requirePermission('forms.read'), formsController.getForm);
router.put('/:id', authenticate, requirePermission('forms.update'), formsController.updateForm);
router.delete('/:id', authenticate, requirePermission('forms.delete'), formsController.deleteForm);
router.post('/:id/publish', authenticate, requirePermission('forms.publish'), formsController.publishForm);
router.post('/:id/archive', authenticate, requirePermission('forms.update'), formsController.archiveForm);
router.post('/:id/duplicate', authenticate, requirePermission('forms.create'), formsController.duplicateForm);
router.get('/:id/versions', authenticate, requirePermission('forms.read'), formsController.getVersions);

export default router;
