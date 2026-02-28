'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export default function GroupsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get('/groups');
      return response.data;
    },
  });

  const groups = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Groupes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          groups.map((group: Record<string, unknown>) => (
            <Card key={group._id as string}>
              <CardHeader className="flex flex-row items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{group.name as string}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {group.description as string || 'Aucune description'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {(group.members as unknown[])?.length || 0} membres
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
