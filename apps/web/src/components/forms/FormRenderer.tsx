'use client';

import { useForm } from 'react-hook-form';
import type { FormSchema } from '@formai/shared';
import { FieldRenderer } from './FieldRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface FormRendererProps {
  schema: FormSchema;
  mode: 'preview' | 'test' | 'live';
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  formId: string;
}

export function FormRenderer({ schema, mode, onSubmit }: FormRendererProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Record<string, unknown>>();

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (mode === 'preview') return;

    setSubmitting(true);
    try {
      await onSubmit(data);
      setSubmitted(true);
      if (schema.settings.allowMultipleSubmissions) {
        reset();
        setSubmitted(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-4xl mb-4">&#10003;</div>
          <p className="text-lg font-medium">{schema.settings.successMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const theme = schema.settings.theme;

  return (
    <Card className="max-w-3xl mx-auto" style={theme ? { borderColor: theme.primaryColor } : undefined}>
      <CardHeader>
        {mode === 'test' && (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-md text-sm mb-2">
            Mode test — les soumissions seront supprimées lors de la publication
          </div>
        )}
        {mode === 'preview' && (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-md text-sm mb-2">
            Aperçu — le formulaire n&apos;est pas soumissible
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid grid-cols-12 gap-4">
            {schema.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                register={register}
                errors={errors}
              />
            ))}
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              disabled={mode === 'preview' || submitting}
              style={theme ? { backgroundColor: theme.primaryColor } : undefined}
            >
              {submitting ? 'Envoi en cours...' : schema.settings.submitButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
