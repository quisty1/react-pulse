import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, ConversationDto, CreateConversationInput } from '@pulse/shared';
import { api } from '@/shared/api';

export function useConversations(workspaceId?: string) {
  return useQuery({
    queryKey: ['conversations', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConversationDto[]>>(
        `/workspaces/${workspaceId}/conversations`,
      );
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
  });
}

export function useCreateConversation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateConversationInput) => {
      const { data } = await api.post<ApiResponse<ConversationDto>>(
        `/workspaces/${workspaceId}/conversations`,
        input,
      );
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations', workspaceId] }),
  });
}
