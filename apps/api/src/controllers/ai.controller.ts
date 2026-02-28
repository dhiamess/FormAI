import { Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { formService } from '../services/form.service';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/ai/generate — Générer un formulaire par IA
 */
export async function generate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { description } = req.body;
    const user = req.user!;

    // Générer le schéma via l'IA
    const aiResult = await aiService.generateForm(description);

    // Créer le formulaire dans la base de données
    const form = await formService.create({
      name: aiResult.name,
      description: aiResult.description,
      schema: {
        fields: aiResult.fields,
        layout: aiResult.layout,
        settings: aiResult.settings,
      },
      organization: user.organization.toString(),
      createdBy: user._id.toString(),
    });

    // Sauvegarder l'historique du prompt
    form.aiPromptHistory.push({
      prompt: description,
      response: aiResult as unknown as Record<string, unknown>,
      model: 'claude-sonnet-4-5-20250929',
      createdAt: new Date(),
    });
    await form.save();

    res.status(201).json({
      success: true,
      data: form,
      message: 'Formulaire généré avec succès',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ai/refine — Raffiner un formulaire existant
 */
export async function refine(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { formId, instructions } = req.body;
    const user = req.user!;

    const form = await formService.getById(formId);

    // Raffiner via l'IA
    const aiResult = await aiService.refineForm(form.schema.toObject(), instructions);

    // Mettre à jour le formulaire
    const updatedForm = await formService.update(formId, {
      name: aiResult.name,
      description: aiResult.description,
      schema: {
        fields: aiResult.fields,
        layout: aiResult.layout,
        settings: aiResult.settings,
      },
      updatedBy: user._id.toString(),
    });

    // Sauvegarder l'historique du prompt
    updatedForm.aiPromptHistory.push({
      prompt: instructions,
      response: aiResult as unknown as Record<string, unknown>,
      model: 'claude-sonnet-4-5-20250929',
      createdAt: new Date(),
    });
    await updatedForm.save();

    res.json({
      success: true,
      data: updatedForm,
      message: 'Formulaire raffiné avec succès',
    });
  } catch (error) {
    next(error);
  }
}
