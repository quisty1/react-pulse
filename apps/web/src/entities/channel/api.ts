import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, ChannelDto, CreateChannelInput } from '@pulse/shared';
import { api } from '@/shared/api';

export function useChannels(workspaceId?: string) {
  return useQuery({
    queryKey: ['channels', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChannelDto[]>>(
        `/workspaces/${workspaceId}/channels`,
      );
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
  });
}

export function useCreateChannel(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const { data } = await api.post<ApiResponse<ChannelDto>>(
        `/workspaces/${workspaceId}/channels`,
        input,
      );
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
}

export function useChannel(channelId?: string) {
  return useQuery({
    queryKey: ['channel', channelId],
    enabled: Boolean(channelId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChannelDto>>(`/channels/${channelId}`);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
  });
}
