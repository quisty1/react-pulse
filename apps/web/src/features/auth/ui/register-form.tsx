import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerSchema, type RegisterInput } from '@pulse/shared';
import { Button, Input, Label } from '@/shared/ui';
import { getErrorMessage } from '@/shared/api/client';
import { useRegister } from '../api/auth-api';

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values);
      navigate('/app');
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="displayName">{t('auth.displayName')}</Label>
        <Input id="displayName" {...form.register('displayName')} />
        {form.formState.errors.displayName ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      {form.formState.errors.root ? (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? t('auth.creating') : t('auth.createAccount')}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Link className="text-primary underline-offset-4 hover:underline" to="/login">
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  );
}
