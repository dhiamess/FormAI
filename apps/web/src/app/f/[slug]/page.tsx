'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Zap } from 'lucide-react';
import axios from 'axios';
import type { IForm } from '@formai/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', slug],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/forms/slug/${slug}`);
      return response.data.data as IForm;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement du formulaire...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Formulaire introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">FormAI</span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">{form.name}</h1>
        {form.description && (
          <p className="text-center text-muted-foreground mb-8">{form.description}</p>
        )}

        <FormRenderer
          schema={form.schema}
          mode="live"
          formId={form._id}
          onSubmit={async (data) => {
            await axios.post(`${API_BASE_URL}/api/forms/${form._id}/submissions`, { data });
          }}
        />
      </div>
    </div>
  );
}
