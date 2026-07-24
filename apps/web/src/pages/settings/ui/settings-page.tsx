import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { useUpdateProfile } from '@/features/auth/api/auth-api';
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Label } from '@/shared/ui';
import { toast } from 'sonner';

export function SettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const form = useForm({
    defaultValues: {
      displayName: user?.displayName ?? '',
      statusMessage: user?.statusMessage ?? '',
    },
  });

  const initials = useMemo(
    () =>
      (user?.displayName ?? '?')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [user?.displayName],
  );

  return (
    <div className="mx-auto w-full max-w-lg flex-1 animate-fade-in p-6">
      <h1 className="font-display text-2xl font-bold">{t('settings.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('app.tagline')}</p>

      <section className="mt-8 rounded-xl border bg-card/80 p-5">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-pulse-teal animate-pulse-dot" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold">{user?.displayName}</div>
            <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await update.mutateAsync({
              displayName: values.displayName,
              statusMessage: values.statusMessage || null,
            });
            toast.success(t('settings.updated'));
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('settings.displayName')}</Label>
            <Input id="displayName" {...form.register('displayName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statusMessage">{t('settings.status')}</Label>
            <Input
              id="statusMessage"
              placeholder={t('settings.statusPlaceholder')}
              {...form.register('statusMessage')}
            />
          </div>
          <Button type="submit" disabled={update.isPending}>
            {t('common.save')}
          </Button>
        </form>
      </section>
    </div>
  );
}
