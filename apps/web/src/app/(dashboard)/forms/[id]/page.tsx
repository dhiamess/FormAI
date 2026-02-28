'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from '@/hooks/useForms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { ArrowLeft, Pencil, Rocket, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePublishForm } from '@/hooks/useForms';
import { api } from '@/lib/api';

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const { data: form, isLoading } = useForm(formId);
  const publishMutation = usePublishForm();

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!form) return <p className="text-destructive">Formulaire non trouvé</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{form.name}</h1>
              <StatusBadge status={form.status} />
            </div>
            <p className="text-muted-foreground">{form.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {form.status === 'published' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/f/${form.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-1" />
                Voir le formulaire
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/forms/${form._id}/submissions`}>
              Soumissions
            </Link>
          </Button>
          {form.status === 'draft' && (
            <Button
              size="sm"
              onClick={async () => {
                await publishMutation.mutateAsync(form._id);
                router.refresh();
              }}
            >
              <Rocket className="h-4 w-4 mr-1" />
              Publier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>v{form.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Champs</span>
              <span>{form.schema.fields.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{form.slug}</span>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <FormRenderer
                schema={form.schema}
                mode="preview"
                formId={form._id}
                onSubmit={async () => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
