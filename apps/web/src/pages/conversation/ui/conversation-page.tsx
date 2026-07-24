import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, ConversationDto } from '@pulse/shared';
import { api } from '@/shared/api/client';
import { MessageArea } from '@/widgets/message-area';
import { ErrorState, Skeleton } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';

export function ConversationPage() {
  const { conversationId } = useParams();
  const me = useAuthStore((s) => s.user);
  const conversation = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: Boolean(conversationId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConversationDto>>(
        `/conversations/${conversationId}`,
      );
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
  });

  if (conversation.isLoading) {
    return <Skeleton className="m-4 h-full" />;
  }

  if (conversation.isError || !conversation.data) {
    return <ErrorState onRetry={() => void conversation.refetch()} />;
  }

  const title =
    conversation.data.name ??
    conversation.data.members
      .filter((m) => m.id !== me?.id)
      .map((m) => m.displayName)
      .join(', ');

  return <MessageArea conversationId={conversation.data.id} title={title} />;
}
