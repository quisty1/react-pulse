import { Navigate, useParams } from 'react-router-dom';
import { useChannels } from '@/entities/channel';
import { useWorkspaces } from '@/entities/workspace';
import { EmptyState, Skeleton } from '@/shared/ui';

export function AppHomePage() {
  const { workspaceId } = useParams();
  const workspaces = useWorkspaces();
  const channels = useChannels(workspaceId ?? workspaces.data?.[0]?.id);

  if (workspaces.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (!workspaces.data?.length) {
    return (
      <EmptyState
        title="Create your first workspace"
        description="Use the + button in the workspace switcher to get started."
      />
    );
  }

  const wsId = workspaceId ?? workspaces.data[0]!.id;
  if (!workspaceId) {
    return <Navigate to={`/app/${wsId}`} replace />;
  }

  const firstChannel = channels.data?.[0];
  if (firstChannel) {
    return <Navigate to={`/app/${wsId}/channels/${firstChannel.id}`} replace />;
  }

  return <EmptyState title="No channels yet" description="Create a channel from the sidebar." />;
}
