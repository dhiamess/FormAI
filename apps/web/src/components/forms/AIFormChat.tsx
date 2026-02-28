'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useGenerateForm, useRefineForm } from '@/hooks/useAI';
import { Loader2, Sparkles, Send } from 'lucide-react';
import type { IForm } from '@formai/shared';

interface AIFormChatProps {
  onFormGenerated: (form: IForm) => void;
  currentForm?: IForm | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickSuggestions = [
  'Ajouter des validations plus strictes',
  'Ajouter une section pour les commentaires',
  'Rendre le formulaire multi-étapes',
  'Ajouter des champs conditionnels',
];

export function AIFormChat({ onFormGenerated, currentForm }: AIFormChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const generateMutation = useGenerateForm();
  const refineMutation = useRefineForm();

  const isLoading = generateMutation.isPending || refineMutation.isPending;

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    try {
      let form: IForm;

      if (currentForm) {
        form = await refineMutation.mutateAsync({
          formId: currentForm._id,
          instructions: userMessage,
        });
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Formulaire "${form.name}" mis à jour (version ${form.version}).` },
        ]);
      } else {
        form = await generateMutation.mutateAsync(userMessage);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Formulaire "${form.name}" généré avec ${form.schema.fields.length} champs.` },
        ]);
      }

      onFormGenerated(form);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Décrivez votre formulaire</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Décrivez en langage naturel le formulaire que vous souhaitez créer.
              L&apos;IA se chargera de le structurer pour vous.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Card key={i} className={msg.role === 'user' ? 'ml-8 bg-primary/5' : 'mr-8'}>
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {msg.role === 'user' ? 'Vous' : 'FormAI'}
              </p>
              <p className="text-sm">{msg.content}</p>
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <Card className="mr-8">
            <CardContent className="p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Génération en cours...</span>
            </CardContent>
          </Card>
        )}
      </div>

      {currentForm && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {quickSuggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setInput(suggestion)}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentForm
                ? 'Décrivez les modifications souhaitées...'
                : 'Décrivez votre formulaire en langage naturel...'
            }
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button onClick={handleSubmit} disabled={isLoading || !input.trim()} size="icon" className="self-end">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
