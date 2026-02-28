'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export default function ConnectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const response = await api.get('/connections');
      return response.data;
    },
  });

  const connections = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connexions</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune connexion configurée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((conn: Record<string, unknown>) => (
            <Card key={conn._id as string}>
              <CardHeader className="flex flex-row items-center gap-3">
                <Database className="h-5 w-5" />
                <CardTitle className="text-base">{conn.name as string}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Badge variant="secondary">{conn.type as string}</Badge>
                <Badge variant={conn.status === 'active' ? 'success' : 'destructive'}>
                  {conn.status as string}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
