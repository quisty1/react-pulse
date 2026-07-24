import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
