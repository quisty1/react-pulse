import { useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { useMessages } from '@/entities/message';
import { MessageItem } from '@/entities/message/ui/message-item';
import { MessageComposer } from '@/features/send-message';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import {
  joinChannelRoom,
  joinConversationRoom,
  leaveChannelRoom,
  leaveConversationRoom,
} from '@/shared/lib/socket';

interface MessageAreaProps {
  channelId?: string;
  conversationId?: string;
  title: string;
  subtitle?: string | null;
}

export function MessageArea({ channelId, conversationId, title, subtitle }: MessageAreaProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const query = useMessages({ channelId, conversationId, parentId: null });

  useEffect(() => {
    if (channelId) {
      joinChannelRoom(channelId);
      return () => leaveChannelRoom(channelId);
    }
    if (conversationId) {
      joinConversationRoom(conversationId);
      return () => leaveConversationRoom(conversationId);
    }
  }, [channelId, conversationId]);

  const messages = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 12,
  });

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
    // scroll only when room or length changes, not on every virtualizer identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, channelId, conversationId]);

  if (query.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label={title}>
      <header className="flex items-start justify-between border-b px-4 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {query.hasNextPage ? (
          <button
            type="button"
            className="text-sm text-primary"
            onClick={() => void query.fetchNextPage()}
          >
            Load older
          </button>
        ) : null}
      </header>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {messages.length === 0 ? (
          <EmptyState title={t('chat.emptyTitle')} description={t('chat.emptyDescription')} />
        ) : (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((item) => {
              const message = messages[item.index]!;
              const prev = messages[item.index - 1];
              const showHeader = !prev || prev.author.id !== message.author.id;
              return (
                <div
                  key={message.id}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 w-full"
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  <MessageItem message={message} showHeader={showHeader} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MessageComposer channelId={channelId} conversationId={conversationId} targetName={title} />
    </section>
  );
}
