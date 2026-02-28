'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { IForm, FormStatus } from '@formai/shared';

export function useForms(options?: { status?: FormStatus; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['forms', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.search) params.set('search', options.search);
      if (options?.page) params.set('page', String(options.page));

      const response = await api.get(`/forms?${params}`);
      return response.data as { data: IForm[]; pagination: { total: number; totalPages: number } };
    },
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const response = await api.get(`/forms/${formId}`);
      return response.data.data as IForm;
    },
    enabled: !!formId,
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string) => {
      const response = await api.post(`/forms/${formId}/publish`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string) => {
      await api.delete(`/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useDuplicateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string) => {
      const response = await api.post(`/forms/${formId}/duplicate`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}
