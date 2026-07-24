import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { ApiResponse, CreateMessageInput, MessageDto, PaginatedResult } from '@pulse/shared';
import { api } from '@/shared/api';
import { useAuthStore } from '@/features/auth';

function messagesKey(channelId?: string, conversationId?: string, parentId?: string | null) {
  return ['messages', channelId ?? null, conversationId ?? null, parentId ?? null] as const;
}

export function useMessages(opts: {
  channelId?: string;
  conversationId?: string;
  parentId?: string | null;
}) {
  const { channelId, conversationId, parentId = null } = opts;
  return useInfiniteQuery({
    queryKey: messagesKey(channelId, conversationId, parentId),
    enabled: Boolean(channelId || conversationId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
      const path = channelId
        ? `/channels/${channelId}/messages`
        : `/conversations/${conversationId}/messages`;
      const { data } = await api.get<ApiResponse<PaginatedResult<MessageDto>>>(path, {
        params: { cursor: pageParam, limit: 50, parentId },
        signal,
      });
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    getNextPageParam: (last) =>
      last.meta.hasMore ? (last.meta.nextCursor ?? undefined) : undefined,
  });
}

export function useSendMessage(opts: {
  channelId?: string;
  conversationId?: string;
  parentId?: string;
}) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const key = messagesKey(opts.channelId, opts.conversationId, opts.parentId ?? null);

  return useMutation({
    mutationFn: async (input: CreateMessageInput) => {
      const path = opts.channelId
        ? `/channels/${opts.channelId}/messages`
        : `/conversations/${opts.conversationId}/messages`;
      const { data } = await api.post<ApiResponse<MessageDto>>(path, {
        ...input,
        parentId: opts.parentId,
      });
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<PaginatedResult<MessageDto>>>(key);
      const clientId = input.clientId ?? crypto.randomUUID();
      const optimistic: MessageDto = {
        id: `optimistic-${clientId}`,
        channelId: opts.channelId ?? null,
        conversationId: opts.conversationId ?? null,
        parentId: opts.parentId ?? null,
        author: user!,
        body: input.body,
        clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editedAt: null,
        replyCount: 0,
        reactions: [],
        attachments: [],
        mentionedUserIds: input.mentionedUserIds ?? [],
      };
      qc.setQueryData<InfiniteData<PaginatedResult<MessageDto>>>(key, (old) => {
        if (!old) {
          return {
            pages: [{ items: [optimistic], meta: { nextCursor: null, hasMore: false } }],
            pageParams: [undefined],
          };
        }
        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        if (!last) return old;
        pages[pages.length - 1] = { ...last, items: [...last.items, optimistic] };
        return { ...old, pages };
      });
      return { previous, clientId };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (message, _input, ctx) => {
      qc.setQueryData<InfiniteData<PaginatedResult<MessageDto>>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.clientId && item.clientId === (ctx?.clientId ?? message.clientId)
                ? message
                : item,
            ),
          })),
        };
      });
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const { data } = await api.post(`/messages/${messageId}/reactions`, { emoji });
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });
}

export function useUpdateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body: string }) => {
      const { data } = await api.patch<ApiResponse<MessageDto>>(`/messages/${messageId}`, { body });
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data } = await api.delete(`/messages/${messageId}`);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });
}

export function useThreadMessages(channelId?: string, conversationId?: string, parentId?: string) {
  return useMessages({ channelId, conversationId, parentId });
}

export function useMessage(messageId?: string) {
  return useQuery({
    queryKey: ['message', messageId],
    enabled: Boolean(messageId),
    queryFn: async () => {
      // fallback via list is avoided; parent message comes from cache mostly
      return null as MessageDto | null;
    },
  });
}
