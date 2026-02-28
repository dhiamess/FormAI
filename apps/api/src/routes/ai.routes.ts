import { Router } from 'express';
import { z } from 'zod';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { aiLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validator';

const router = Router();

const generateSchema = z.object({
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
});

const refineSchema = z.object({
  formId: z.string().min(1, 'ID du formulaire requis'),
  instructions: z.string().min(5, 'Les instructions doivent contenir au moins 5 caractères'),
});

router.post(
  '/generate',
  authenticate,
  requirePermission('forms.create'),
  aiLimiter,
  validateBody(generateSchema),
  aiController.generate,
);

router.post(
  '/refine',
  authenticate,
  requirePermission('forms.update'),
  aiLimiter,
  validateBody(refineSchema),
  aiController.refine,
);

export default router;
