'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForms } from '@/hooks/useForms';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileText, Send, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading } = useForms();

  const forms = data?.data || [];
  const totalForms = data?.pagination?.total || 0;

  const stats = [
    { name: 'Formulaires', value: totalForms, icon: FileText, color: 'text-blue-600' },
    { name: 'Soumissions totales', value: '—', icon: Send, color: 'text-green-600' },
    { name: 'Aujourd\'hui', value: '—', icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de votre espace FormAI</p>
        </div>
        <Button asChild>
          <Link href="/forms/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau formulaire
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaires récents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : forms.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucun formulaire pour le moment</p>
              <Button asChild>
                <Link href="/forms/new">Créer votre premier formulaire</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {forms.slice(0, 5).map((form) => (
                <Link
                  key={form._id}
                  href={`/forms/${form._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{form.name}</p>
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  </div>
                  <StatusBadge status={form.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
