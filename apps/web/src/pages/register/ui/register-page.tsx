import { useTranslation } from 'react-i18next';
import { RegisterForm } from '@/features/auth';

export function RegisterPage() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--pulse-teal)/0.16),transparent_40%)]" />
      <div className="relative z-10 w-full max-w-md animate-fade-in rounded-2xl border bg-card/90 p-8 shadow-pulse backdrop-blur">
        <div className="mb-6 text-center">
          <img src="/favicon.svg" alt="" className="mx-auto mb-3 h-12 w-12" />
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('app.name')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.joinPulse')}</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
