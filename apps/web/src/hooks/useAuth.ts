'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IUser } from '@formai/shared';
import { getCurrentUser, logout as doLogout } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  return { user, loading, logout, isAuthenticated: !!user };
}
