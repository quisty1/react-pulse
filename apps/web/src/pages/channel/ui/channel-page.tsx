import { useParams } from 'react-router-dom';
import { useChannel } from '@/entities/channel';
import { MessageArea } from '@/widgets/message-area';
import { ErrorState, Skeleton } from '@/shared/ui';

export function ChannelPage() {
  const { channelId } = useParams();
  const channel = useChannel(channelId);

  if (channel.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (channel.isError || !channel.data) {
    return <ErrorState onRetry={() => void channel.refetch()} />;
  }

  return (
    <MessageArea
      channelId={channel.data.id}
      title={`# ${channel.data.name}`}
      subtitle={channel.data.topic}
    />
  );
}
