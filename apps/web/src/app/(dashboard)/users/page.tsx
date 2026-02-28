'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Chargement...</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Rôle</th>
                  <th className="p-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: Record<string, unknown>) => (
                  <tr key={user._id as string} className="border-b hover:bg-accent/50">
                    <td className="p-4 font-medium">
                      {user.firstName as string} {user.lastName as string}
                    </td>
                    <td className="p-4 text-sm">{user.email as string}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{user.role as string}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
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
