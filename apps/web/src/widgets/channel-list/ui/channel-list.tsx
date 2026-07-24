import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Plus } from 'lucide-react';
import { useState } from 'react';
import { useChannels, useCreateChannel } from '@/entities/channel';
import { useConversations, useCreateConversation } from '@/entities/conversation';
import { ChannelIcon } from '@/entities/message/ui/message-item';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Skeleton,
} from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { api } from '@/shared/api';

export function ChannelList() {
  const { t } = useTranslation();
  const { workspaceId } = useParams();
  const channels = useChannels(workspaceId);
  const conversations = useConversations(workspaceId);
  const createChannel = useCreateChannel(workspaceId!);
  const createConversation = useCreateConversation(workspaceId!);
  const [channelOpen, setChannelOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; displayName: string }>>([]);

  if (!workspaceId) return null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4 text-sidebar-foreground">
      <section>
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
            {t('nav.channels')}
          </h2>
          <Dialog open={channelOpen} onOpenChange={setChannelOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={t('nav.createChannel')}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('nav.createChannel')}</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await createChannel.mutateAsync({
                    name: channelName.toLowerCase().replace(/\s+/g, '-'),
                    type: 'PUBLIC',
                  });
                  setChannelName('');
                  setChannelOpen(false);
                }}
              >
                <Label htmlFor="channel-name">{t('common.name')}</Label>
                <Input
                  id="channel-name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
                <Button type="submit">{t('common.create')}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {channels.isLoading ? <Skeleton className="h-8 w-full bg-white/10" /> : null}
        <ul className="space-y-0.5">
          {channels.data?.map((channel) => (
            <li key={channel.id}>
              <NavLink
                to={`/app/${workspaceId}/channels/${channel.id}`}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-white/10 hover:text-sidebar-foreground',
                    isActive &&
                      'bg-sidebar-active font-medium text-sidebar-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-pulse-teal',
                  )
                }
              >
                <ChannelIcon type={channel.type} />
                <span className="truncate">{channel.name}</span>
                {(channel.unreadCount ?? 0) > 0 ? (
                  <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {channel.unreadCount}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
            {t('nav.directMessages')}
          </h2>
          <Dialog open={dmOpen} onOpenChange={setDmOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={t('nav.startDm')}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('nav.startConversation')}</DialogTitle>
              </DialogHeader>
              <Input
                placeholder={t('nav.searchPeople')}
                value={userQuery}
                onChange={async (e) => {
                  const q = e.target.value;
                  setUserQuery(q);
                  if (q.trim().length < 2) {
                    setUsers([]);
                    return;
                  }
                  const { data } = await api.get('/users/search', {
                    params: { q, workspaceId },
                  });
                  if (data.success) setUsers(data.data);
                }}
              />
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {users.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      onClick={async () => {
                        const conversation = await createConversation.mutateAsync({
                          memberIds: [user.id],
                        });
                        setDmOpen(false);
                        window.location.assign(`/app/${workspaceId}/dms/${conversation.id}`);
                      }}
                    >
                      {user.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        </div>
        <ul className="space-y-0.5">
          {conversations.data?.map((conversation) => {
            const label =
              conversation.name ??
              conversation.members
                .map((m) => m.displayName)
                .filter(Boolean)
                .join(', ');
            return (
              <li key={conversation.id}>
                <NavLink
                  to={`/app/${workspaceId}/dms/${conversation.id}`}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-white/10 hover:text-sidebar-foreground',
                      isActive &&
                        'bg-sidebar-active font-medium text-sidebar-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-pulse-teal',
                    )
                  }
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="truncate">{label}</span>
                  {(conversation.unreadCount ?? 0) > 0 ? (
                    <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
