import { AIService } from '../../src/services/ai.service';

// Mock the Anthropic SDK
jest.mock('../../src/config/ai', () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
  AI_CONFIG: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    systemPrompt: 'test prompt',
  },
}));

import { anthropic } from '../../src/config/ai';

const mockCreate = anthropic.messages.create as jest.Mock;

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService();
    jest.clearAllMocks();
  });

  const validFormResponse = {
    name: 'Formulaire de test',
    description: 'Un formulaire de test',
    fields: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'text',
        label: 'Nom',
        name: 'nom',
        required: true,
        layout: { column: 1, row: 1, width: 6 },
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'email',
        label: 'Email',
        name: 'email',
        required: true,
        layout: { column: 7, row: 1, width: 6 },
      },
    ],
    layout: { type: 'single' },
    settings: {
      submitButtonText: 'Soumettre',
      successMessage: 'Merci !',
      allowMultipleSubmissions: false,
      requireAuth: false,
      notifyOnSubmission: [],
      autoSave: true,
    },
  };

  it('should generate a form from a description', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(validFormResponse) }],
    });

    const result = await service.generateForm('Créer un formulaire de contact');

    expect(result.name).toBe('Formulaire de test');
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].type).toBe('text');
    expect(result.fields[1].type).toBe('email');
  });

  it('should clean markdown backticks from AI response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n' + JSON.stringify(validFormResponse) + '\n```' }],
    });

    const result = await service.generateForm('Test');

    expect(result.name).toBe('Formulaire de test');
  });

  it('should retry on failure', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(validFormResponse) }],
      });

    const result = await service.generateForm('Test');

    expect(result.name).toBe('Formulaire de test');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    await expect(service.generateForm('Test')).rejects.toThrow('API error');
    expect(mockCreate).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should throw if AI returns no text content', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    });

    await expect(service.generateForm('Test')).rejects.toThrow();
  });
});
