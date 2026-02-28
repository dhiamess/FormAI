'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { IForm } from '@formai/shared';

export function useGenerateForm() {
  return useMutation({
    mutationFn: async (description: string) => {
      const response = await api.post('/ai/generate', { description });
      return response.data.data as IForm;
    },
  });
}

export function useRefineForm() {
  return useMutation({
    mutationFn: async ({ formId, instructions }: { formId: string; instructions: string }) => {
      const response = await api.post('/ai/refine', { formId, instructions });
      return response.data.data as IForm;
    },
  });
}
