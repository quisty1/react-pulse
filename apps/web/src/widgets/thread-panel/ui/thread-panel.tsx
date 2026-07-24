import { useMessages } from '@/entities/message';
import { MessageItem } from '@/entities/message/ui/message-item';
import { MessageComposer } from '@/features/send-message';
import { Button, EmptyState, Skeleton } from '@/shared/ui';
import { useUiStore } from '@/shared/lib/ui-store';
import { useTranslation } from 'react-i18next';
import { MessageCircle, X } from 'lucide-react';

interface ThreadPanelProps {
  channelId?: string;
  conversationId?: string;
  parentId: string;
}

export function ThreadPanel({ channelId, conversationId, parentId }: ThreadPanelProps) {
  const { t } = useTranslation();
  const setThreadMessageId = useUiStore((s) => s.setThreadMessageId);
  const query = useMessages({ channelId, conversationId, parentId });
  const messages = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <aside
      className="flex h-full w-full max-w-md animate-slide-in-right flex-col border-l bg-card"
      aria-label={t('chat.thread')}
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-display text-base font-semibold">{t('chat.thread')}</h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label={t('chat.closeThread')}
          onClick={() => setThreadMessageId(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {query.isLoading ? <Skeleton className="h-20 w-full" /> : null}
        {!query.isLoading && messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title={t('chat.emptyTitle')} />
        ) : (
          messages.map((message) => <MessageItem key={message.id} message={message} />)
        )}
      </div>
      <MessageComposer
        channelId={channelId}
        conversationId={conversationId}
        parentId={parentId}
        targetName={t('chat.thread')}
      />
    </aside>
  );
}
