import { Navigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { Button, ErrorState, Skeleton } from '@/shared/ui';
import { useState } from 'react';

export function InvitePage() {
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Workspace invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accept the invite to join the workspace.
        </p>
        {accept.isError ? <ErrorState description={String(accept.error)} /> : null}
        {accept.isPending ? <Skeleton className="mx-auto mt-4 h-10 w-40" /> : null}
        <Button className="mt-4" onClick={() => accept.mutate()} disabled={accept.isPending}>
          Accept invite
        </Button>
      </div>
    </div>
  );
}
