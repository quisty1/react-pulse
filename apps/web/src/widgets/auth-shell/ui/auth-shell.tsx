import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthShell({ title, subtitle, children, footer, className }: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--pulse-teal)/0.18),transparent_35%),radial-gradient(circle_at_80%_0%,hsl(168_40%_20%/0.22),transparent_32%)]" />
      <div
        className={cn(
          'relative z-10 w-full max-w-md animate-fade-in rounded-2xl border bg-card/90 p-8 shadow-pulse backdrop-blur',
          className,
        )}
      >
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <span className="relative inline-flex">
              <img src="/favicon.svg" alt="" className="h-12 w-12" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pulse-teal animate-pulse-dot" />
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              {t('app.name')}
            </h1>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t('app.tagline')}</p>
          <p className="mt-4 font-display text-xl font-semibold text-foreground">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
