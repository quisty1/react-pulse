import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Paperclip, Send, Smile } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Button } from '@/shared/ui';
import { api } from '@/shared/api';
import { useSendMessage } from '@/entities/message';
import { emitTyping } from '@/shared/lib/socket';
import { cn } from '@/shared/lib/cn';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface MessageComposerProps {
  channelId?: string;
  conversationId?: string;
  parentId?: string;
  targetName: string;
}

export function MessageComposer({
  channelId,
  conversationId,
  parentId,
  targetName,
}: MessageComposerProps) {
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const typingTimer = useRef<number | null>(null);
  const send = useSendMessage({ channelId, conversationId, parentId });

  const stopTyping = useCallback(() => {
    emitTyping({ channelId, conversationId }, false);
  }, [channelId, conversationId]);

  const onChange = (value: string) => {
    setBody(value);
    emitTyping({ channelId, conversationId }, true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(stopTyping, 1200);
  };

  const onDrop = useCallback(async (files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/files', form);
      if (data.success) {
        setAttachmentIds((prev) => [...prev, data.data.id]);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed && attachmentIds.length === 0) return;
    const mentionedUserIds = [...trimmed.matchAll(/@\[([a-z0-9]+)\]/gi)].map((m) => m[1]!);
    await send.mutateAsync({
      body: trimmed || '(attachment)',
      clientId: crypto.randomUUID(),
      attachmentIds,
      mentionedUserIds,
    });
    setBody('');
    setAttachmentIds([]);
    stopTyping();
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-t bg-card/80 p-3 backdrop-blur',
        isDragActive && 'ring-2 ring-primary ring-inset',
      )}
    >
      <input {...getInputProps()} />
      <div className="rounded-xl border bg-background p-2 shadow-sm">
        <label htmlFor="composer" className="sr-only">
          {t('chat.messagePlaceholder', { name: targetName })}
        </label>
        <textarea
          id="composer"
          rows={2}
          value={body}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={t('chat.messagePlaceholder', { name: targetName })}
          className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Attach file"
              onClick={open}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Insert emoji"
                onClick={() => setEmojiOpen((v) => !v)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              {emojiOpen ? (
                <div className="absolute bottom-10 left-0 z-20">
                  <Suspense fallback={null}>
                    <EmojiPicker
                      onEmojiClick={(emoji) => {
                        setBody((prev) => `${prev}${emoji.emoji}`);
                        setEmojiOpen(false);
                      }}
                      width={320}
                      height={360}
                    />
                  </Suspense>
                </div>
              ) : null}
            </div>
            {attachmentIds.length > 0 ? (
              <span className="text-xs text-muted-foreground">{attachmentIds.length} file(s)</span>
            ) : null}
          </div>
          <Button type="button" size="sm" onClick={() => void submit()} disabled={send.isPending}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
