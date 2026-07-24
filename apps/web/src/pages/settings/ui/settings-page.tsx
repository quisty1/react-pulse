import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { useUpdateProfile } from '@/features/auth/api/auth-api';
import { Button, Input, Label } from '@/shared/ui';
import { toast } from 'sonner';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const form = useForm({
    defaultValues: {
      displayName: user?.displayName ?? '',
      statusMessage: user?.statusMessage ?? '',
    },
  });

  return (
    <div className="mx-auto w-full max-w-lg flex-1 p-6">
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await update.mutateAsync({
            displayName: values.displayName,
            statusMessage: values.statusMessage || null,
          });
          toast.success('Profile updated');
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" {...form.register('displayName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statusMessage">Status</Label>
          <Input id="statusMessage" {...form.register('statusMessage')} />
        </div>
        <Button type="submit" disabled={update.isPending}>
          Save
        </Button>
      </form>
    </div>
  );
}
