import { anthropic, AI_CONFIG } from '../config/ai';
import { FieldType } from '@formai/shared';
import { z } from 'zod';
import { logger } from '../utils/logger';

/** Zod schema pour valider la sortie de l'IA */
const AIFormOutputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  fields: z.array(z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(FieldType),
    label: z.string().min(1),
    name: z.string().regex(/^[a-z][a-z0-9_]*$/),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    required: z.boolean(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      customMessage: z.string().optional(),
    }).optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
    conditional: z.object({
      field: z.string(),
      operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan']),
      value: z.unknown(),
    }).optional(),
    layout: z.object({
      column: z.number().min(1).max(12),
      row: z.number().min(1),
      width: z.number().min(1).max(12),
    }).optional(),
    defaultValue: z.unknown().optional(),
    readOnly: z.boolean().optional(),
  })).min(1),
  layout: z.object({
    type: z.enum(['single', 'multi-step', 'tabs']),
    steps: z.array(z.object({
      title: z.string(),
      fields: z.array(z.string()),
    })).optional(),
  }),
  settings: z.object({
    submitButtonText: z.string(),
    successMessage: z.string(),
    redirectUrl: z.string().optional(),
    allowMultipleSubmissions: z.boolean(),
    requireAuth: z.boolean(),
    notifyOnSubmission: z.array(z.string()),
    autoSave: z.boolean(),
    theme: z.object({
      primaryColor: z.string(),
      fontFamily: z.string(),
      borderRadius: z.string(),
    }).optional(),
  }),
});

export type AIFormOutput = z.infer<typeof AIFormOutputSchema>;

export class AIService {
  /**
   * Génère un schéma de formulaire à partir d'une description textuelle
   */
  async generateForm(description: string, retryCount = 0): Promise<AIFormOutput> {
    const MAX_RETRIES = 2;

    try {
      const response = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        system: AI_CONFIG.systemPrompt,
        messages: [
          { role: 'user', content: description },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in AI response');
      }

      // Nettoyer le JSON (au cas où l'IA ajoute des backticks)
      let jsonStr = textContent.text.trim();
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

      const parsed = JSON.parse(jsonStr);
      const validated = AIFormOutputSchema.parse(parsed);

      logger.info('Form generated successfully by AI', {
        name: validated.name,
        fieldCount: validated.fields.length,
      });

      return validated;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        logger.warn(`AI generation failed, retry ${retryCount + 1}/${MAX_RETRIES}`, { error });
        return this.generateForm(description, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Raffine un formulaire existant avec des instructions supplémentaires
   */
  async refineForm(
    currentSchema: Record<string, unknown>,
    instructions: string,
  ): Promise<AIFormOutput> {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      system: AI_CONFIG.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Voici le formulaire actuel :\n${JSON.stringify(currentSchema, null, 2)}\n\nModifications demandées :\n${instructions}\n\nRetourne le formulaire complet modifié en JSON.`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    let jsonStr = textContent.text.trim();
    jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

    return AIFormOutputSchema.parse(JSON.parse(jsonStr));
  }
}

export const aiService = new AIService();
