import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import type { NotificationDto } from '@pulse/shared';
import { api } from '@/shared/api';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState } from '@/shared/ui';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<NotificationDto[]>([]);

  useEffect(() => {
    if (!open) return;
    void api.get('/notifications').then((res) => {
      if (res.data.success) setItems(res.data.data);
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('notifications.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await api.post('/notifications/read-all');
              setItems((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
          >
            {t('notifications.markAllRead')}
          </Button>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title={t('notifications.empty')} className="py-10" />
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className={`rounded-md border px-3 py-2 text-sm transition-opacity ${item.read ? 'opacity-60' : ''}`}
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-muted-foreground">{item.body}</div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
