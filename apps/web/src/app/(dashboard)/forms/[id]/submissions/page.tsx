'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SubmissionsPage() {
  const params = useParams();
  const formId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', formId],
    queryFn: async () => {
      const response = await api.get(`/forms/${formId}/submissions`);
      return response.data;
    },
  });

  const submissions = data?.data || [];

  const handleExport = async () => {
    const response = await api.get(`/forms/${formId}/submissions/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `submissions-${formId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/forms/${formId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Soumissions</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Exporter CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Chargement...</p>
          ) : submissions.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">Aucune soumission</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub: Record<string, unknown>) => (
                  <tr key={sub._id as string} className="border-b hover:bg-accent/50">
                    <td className="p-4 text-sm font-mono">
                      {(sub._id as string).slice(-8)}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{sub.status as string}</Badge>
                    </td>
                    <td className="p-4 text-sm">
                      {new Date((sub.metadata as Record<string, string>)?.submittedAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-4 text-sm">
                      {(sub.metadata as Record<string, string>)?.source || 'web'}
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
