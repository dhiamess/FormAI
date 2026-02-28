'use client';

import { Badge } from '@/components/ui/badge';
import type { FormStatus } from '@formai/shared';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  testing: { label: 'En test', variant: 'warning' },
  published: { label: 'Publié', variant: 'success' },
  archived: { label: 'Archivé', variant: 'destructive' },
};

export function StatusBadge({ status }: { status: FormStatus | string }) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
