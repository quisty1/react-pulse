import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useWorkspaces, useCreateWorkspace } from '@/entities/workspace';
import {
  Avatar,
  AvatarFallback,
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
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';

export function WorkspaceSwitcher() {
  const { t } = useTranslation();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkspaces();
  const create = useCreateWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  if (isLoading) return <Skeleton className="h-10 w-10 rounded-xl" />;

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {data?.map((ws) => (
        <Link
          key={ws.id}
          to={`/app/${ws.id}`}
          title={ws.name}
          className={cn(
            'rounded-xl ring-offset-background transition-transform hover:scale-105',
            workspaceId === ws.id && 'ring-2 ring-primary',
          )}
        >
          <Avatar className="h-10 w-10 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/20 font-display text-sm">
              {ws.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl text-sidebar-foreground"
            aria-label={t('nav.createWorkspace')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('nav.createWorkspace')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const ws = await create.mutateAsync({ name });
              setOpen(false);
              setName('');
              navigate(`/app/${ws.id}`);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="ws-name">{t('common.name')}</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <Button type="submit" disabled={create.isPending}>
              {t('common.create')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
