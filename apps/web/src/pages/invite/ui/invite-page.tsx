import { Navigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/shared/api/client';
import { Button, ErrorState, Skeleton } from '@/shared/ui';
import { AuthShell } from '@/widgets/auth-shell';
import { useState } from 'react';

export function InvitePage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const accept = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/workspaces/invites/${token}/accept`);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: (ws) => setWorkspaceId(ws.id),
  });

  if (workspaceId) return <Navigate to={`/app/${workspaceId}`} replace />;

  return (
    <AuthShell title={t('invite.title')} subtitle={t('invite.description')}>
      {accept.isError ? <ErrorState description={String(accept.error)} /> : null}
      {accept.isPending ? <Skeleton className="mx-auto mt-2 h-10 w-40" /> : null}
      <Button className="mt-2 w-full" onClick={() => accept.mutate()} disabled={accept.isPending}>
        {t('invite.accept')}
      </Button>
    </AuthShell>
  );
}
