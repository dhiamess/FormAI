'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useForms, useDeleteForm, usePublishForm, useDuplicateForm } from '@/hooks/useForms';
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, Copy, Archive } from 'lucide-react';
import Link from 'next/link';
import type { IForm } from '@formai/shared';

export default function FormsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useForms({ search });
  const deleteMutation = useDeleteForm();
  const publishMutation = usePublishForm();
  const duplicateMutation = useDuplicateForm();

  const forms = data?.data || [];

  const handleDelete = async (form: IForm) => {
    if (confirm(`Supprimer "${form.name}" ?`)) {
      await deleteMutation.mutateAsync(form._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Formulaires</h1>
        <Button asChild>
          <Link href="/forms/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un formulaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Chargement...</p>
          ) : forms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search ? 'Aucun formulaire trouvé' : 'Aucun formulaire créé'}
              </p>
              {!search && (
                <Button asChild>
                  <Link href="/forms/new">Créer votre premier formulaire</Link>
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Soumissions</th>
                  <th className="p-4 font-medium">Version</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form._id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/forms/${form._id}`} className="font-medium hover:underline">
                        {form.name}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{form.description}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={form.status} />
                    </td>
                    <td className="p-4 text-sm">—</td>
                    <td className="p-4 text-sm">v{form.version}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/forms/${form._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {form.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => publishMutation.mutate(form._id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateMutation.mutate(form._id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(form)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
