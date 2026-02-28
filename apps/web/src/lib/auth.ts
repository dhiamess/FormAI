import { api } from './api';
import type { IUser } from '@formai/shared';

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken, refreshToken, user } = response.data.data;

  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return user as IUser;
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}) {
  const response = await api.post('/auth/register', data);
  const { accessToken, refreshToken, user } = response.data.data;

  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return user as IUser;
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}

export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}
