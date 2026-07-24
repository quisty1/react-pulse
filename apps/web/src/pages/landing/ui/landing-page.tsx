import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';

export function LandingPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (hydrated && user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-pulse-charcoal text-sidebar-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-pulse-teal/25 blur-3xl animate-ambient-pulse" />
        <div className="absolute -right-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(168_28%_8%/0.55)_70%)]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="animate-fade-in">
          <div className="relative mx-auto mb-8 inline-flex">
            <img src="/favicon.svg" alt="" className="h-20 w-20 drop-shadow-lg" />
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-pulse-teal shadow-[0_0_12px_hsl(var(--pulse-teal))] animate-pulse-dot" />
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            {t('app.name')}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-sidebar-foreground/70 sm:text-lg">
            {t('app.tagline')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="min-w-[9rem] transition-transform hover:scale-[1.02]"
            >
              <Link to="/login">{t('auth.signIn')}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-[9rem] border-white/20 bg-transparent text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
            >
              <Link to="/register">{t('auth.createAccount')}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
