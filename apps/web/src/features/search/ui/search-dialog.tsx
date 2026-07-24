import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/shared/ui';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

interface SearchHit {
  id: string;
  body: string;
  channelId: string | null;
  conversationId: string | null;
  channelName: string | null;
  author: { displayName: string };
}

export function SearchDialog({ open, onOpenChange, workspaceId }: SearchDialogProps) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const navigate = useNavigate();
  const canSearch = open && Boolean(workspaceId) && q.trim().length >= 2;

  useEffect(() => {
    if (!canSearch || !workspaceId) {
      return;
    }
    const handle = window.setTimeout(() => {
      void api.get(`/workspaces/${workspaceId}/search`, { params: { q } }).then((res) => {
        if (res.data.success) setHits(res.data.data);
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [q, canSearch, workspaceId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQ('');
          setHits([]);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search messages</DialogTitle>
        </DialogHeader>
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length < 2) setHits([]);
          }}
          placeholder="Search by text…"
          autoFocus
        />
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="w-full rounded-md border px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  if (hit.channelId) {
                    navigate(`/app/${workspaceId}/channels/${hit.channelId}#message-${hit.id}`);
                  }
                  if (hit.conversationId) {
                    navigate(`/app/${workspaceId}/dms/${hit.conversationId}#message-${hit.id}`);
                  }
                  onOpenChange(false);
                }}
              >
                <div className="text-xs text-muted-foreground">
                  {hit.author.displayName}
                  {hit.channelName ? ` · #${hit.channelName}` : ''}
                </div>
                <div className="truncate text-sm">{hit.body}</div>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
