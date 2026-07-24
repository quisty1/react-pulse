import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  className,
  action,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex animate-fade-in flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
