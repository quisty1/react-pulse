import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Hash, Lock, MoreHorizontal, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MessageDto } from '@pulse/shared';
import { useAuthStore } from '@/features/auth';
import { useDeleteMessage, useToggleReaction, useUpdateMessage } from '@/entities/message';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { useUiStore } from '@/shared/lib/ui-store';
import { cn } from '@/shared/lib/cn';
import { lazy, Suspense } from 'react';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface MessageItemProps {
  message: MessageDto;
  showHeader?: boolean;
}

export function MessageItem({ message, showHeader = true }: MessageItemProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setThreadMessageId = useUiStore((s) => s.setThreadMessageId);
  const toggleReaction = useToggleReaction();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const isMine = user?.id === message.author.id;
  const draftBody = editing ? draft : message.body;

  const initials = useMemo(
    () =>
      message.author.displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [message.author.displayName],
  );

  return (
    <article
      id={`message-${message.id}`}
      className={cn(
        'group relative grid grid-cols-[40px_1fr] gap-3 rounded-lg px-3 py-2 hover:bg-muted/50',
        message.id.startsWith('optimistic-') && 'opacity-70',
      )}
    >
      {showHeader ? (
        <Avatar>
          {message.author.avatarUrl ? <AvatarImage src={message.author.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ) : (
        <div />
      )}
      <div className="min-w-0">
        {showHeader ? (
          <header className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className="font-semibold">{message.author.displayName}</span>
            <time className="text-xs text-muted-foreground" dateTime={message.createdAt}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </time>
            {message.editedAt ? (
              <span className="text-xs text-muted-foreground">(edited)</span>
            ) : null}
          </header>
        ) : null}

        {editing ? (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={draftBody}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await updateMessage.mutateAsync({ messageId: message.id, body: draft });
                  setEditing(false);
                }}
              >
                {t('common.save')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(message.body);
                  setEditing(false);
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <Markdown rehypePlugins={[rehypeSanitize]}>{message.body}</Markdown>
          </div>
        )}

        {message.attachments.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {message.attachments.map((file) => (
              <li key={file.id}>
                <a
                  className="text-sm text-primary underline-offset-2 hover:underline"
                  href={file.url}
                >
                  {file.fileName}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {message.reactions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs',
                  reaction.me ? 'border-primary bg-primary/10' : 'border-border bg-background',
                )}
                onClick={() =>
                  toggleReaction.mutate({ messageId: message.id, emoji: reaction.emoji })
                }
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        ) : null}

        {message.replyCount > 0 && !message.parentId ? (
          <button
            type="button"
            className="mt-2 text-sm font-medium text-primary"
            onClick={() => setThreadMessageId(message.id)}
          >
            {message.replyCount} {t('chat.thread').toLowerCase()}
            {message.replyCount > 1 ? 's' : ''}
          </button>
        ) : null}
      </div>

      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Add reaction"
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          {emojiOpen ? (
            <div className="absolute right-0 z-20 mt-1">
              <Suspense fallback={null}>
                <EmojiPicker
                  onEmojiClick={(emoji) => {
                    toggleReaction.mutate({ messageId: message.id, emoji: emoji.emoji });
                    setEmojiOpen(false);
                  }}
                  width={320}
                  height={360}
                />
              </Suspense>
            </div>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Message actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setThreadMessageId(message.id)}>
              {t('chat.reply')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${window.location.origin}${window.location.pathname}#message-${message.id}`,
                );
              }}
            >
              {t('chat.copyLink')}
            </DropdownMenuItem>
            {isMine ? (
              <DropdownMenuItem
                onClick={() => {
                  setDraft(message.body);
                  setEditing(true);
                }}
              >
                {t('chat.edit')}
              </DropdownMenuItem>
            ) : null}
            {isMine ? (
              <DropdownMenuItem
                onClick={() => {
                  if (window.confirm('Delete this message?')) {
                    deleteMessage.mutate(message.id);
                  }
                }}
              >
                {t('chat.delete')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

export function ChannelIcon({ type }: { type: 'PUBLIC' | 'PRIVATE' }) {
  return type === 'PRIVATE' ? (
    <Lock className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <Hash className="h-3.5 w-3.5" aria-hidden />
  );
}
