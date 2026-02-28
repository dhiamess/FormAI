'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {user && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom</span>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rôle</span>
                <span className="capitalize">{user.role}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
