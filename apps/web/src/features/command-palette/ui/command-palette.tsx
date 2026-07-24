import { useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate, useParams } from 'react-router-dom';
import { useChannels } from '@/entities/channel';
import { useConversations } from '@/entities/conversation';
import { Dialog, DialogContent } from '@/shared/ui';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const channels = useChannels(workspaceId);
  const conversations = useConversations(workspaceId);
  const [query, setQuery] = useState('');
  const activeQuery = open ? query : '';

  const items = useMemo(() => {
    const channelItems =
      channels.data?.map((c) => ({
        id: c.id,
        label: `# ${c.name}`,
        href: `/app/${workspaceId}/channels/${c.id}`,
      })) ?? [];
    const dmItems =
      conversations.data?.map((c) => ({
        id: c.id,
        label: c.name ?? c.members.map((m) => m.displayName).join(', '),
        href: `/app/${workspaceId}/dms/${c.id}`,
      })) ?? [];
    const all = [...channelItems, ...dmItems];
    if (!activeQuery.trim()) return all;
    return all.filter((i) => i.label.toLowerCase().includes(activeQuery.toLowerCase()));
  }, [channels.data, conversations.data, activeQuery, workspaceId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="overflow-hidden p-0">
        <Command label="Command palette" className="bg-card">
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Jump to channel or DM…"
            className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-2 py-6 text-center text-sm text-muted-foreground">
              No results
            </Command.Empty>
            {items.map((item) => (
              <Command.Item
                key={item.id}
                value={item.label}
                onSelect={() => {
                  navigate(item.href);
                  onOpenChange(false);
                }}
                className="cursor-pointer rounded-md px-2 py-2 text-sm data-[selected=true]:bg-muted"
              >
                {item.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
