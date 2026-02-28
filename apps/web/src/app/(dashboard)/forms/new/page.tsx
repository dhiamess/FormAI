'use client';

import { useState } from 'react';
import { AIFormChat } from '@/components/forms/AIFormChat';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Button } from '@/components/ui/button';
import { usePublishForm } from '@/hooks/useForms';
import { useRouter } from 'next/navigation';
import type { IForm } from '@formai/shared';
import { Eye, TestTube, Rocket } from 'lucide-react';

export default function NewFormPage() {
  const [form, setForm] = useState<IForm | null>(null);
  const [previewMode, setPreviewMode] = useState<'preview' | 'test'>('preview');
  const publishMutation = usePublishForm();
  const router = useRouter();

  const handlePublish = async () => {
    if (!form) return;
    await publishMutation.mutateAsync(form._id);
    router.push(`/forms/${form._id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouveau formulaire</h1>
        {form && (
          <div className="flex gap-2">
            <Button
              variant={previewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Aperçu
            </Button>
            <Button
              variant={previewMode === 'test' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('test')}
            >
              <TestTube className="h-4 w-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishMutation.isPending}>
              <Rocket className="h-4 w-4 mr-1" />
              Publier
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        <div className="border rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-muted/50">
            <h2 className="text-sm font-medium">Assistant IA</h2>
          </div>
          <AIFormChat onFormGenerated={setForm} currentForm={form} />
        </div>

        <div className="border rounded-lg overflow-y-auto p-4">
          <div className="p-3 border-b bg-muted/50 -m-4 mb-4">
            <h2 className="text-sm font-medium">
              {form ? form.name : 'Aperçu du formulaire'}
            </h2>
          </div>
          {form ? (
            <FormRenderer
              schema={form.schema}
              mode={previewMode}
              formId={form._id}
              onSubmit={async (data) => {
                const { api } = await import('@/lib/api');
                await api.post(`/forms/${form._id}/submissions?mode=test`, { data });
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>L&apos;aperçu apparaîtra ici une fois le formulaire généré</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
