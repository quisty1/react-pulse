import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, useRestoreSession } from '@/features/auth';
import { AppShell } from '@/widgets/app-shell';
import { Skeleton } from '@/shared/ui';
import { useUiStore } from '@/shared/lib/ui-store';
import { i18n } from '@/app/i18n';

const LoginPage = lazy(() =>
  import('@/pages/login/ui/login-page').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/pages/register/ui/register-page').then((m) => ({ default: m.RegisterPage })),
);
const AppHomePage = lazy(() =>
  import('@/pages/app-home/ui/app-home-page').then((m) => ({ default: m.AppHomePage })),
);
const ChannelPage = lazy(() =>
  import('@/pages/channel/ui/channel-page').then((m) => ({ default: m.ChannelPage })),
);
const ConversationPage = lazy(() =>
  import('@/pages/conversation/ui/conversation-page').then((m) => ({
    default: m.ConversationPage,
  })),
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/ui/settings-page').then((m) => ({ default: m.SettingsPage })),
);
const InvitePage = lazy(() =>
  import('@/pages/invite/ui/invite-page').then((m) => ({ default: m.InvitePage })),
);

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  useRestoreSession();
  const locale = useUiStore((s) => s.locale);
  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);
  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <Skeleton className="h-10 w-40" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<AppHomePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path=":workspaceId" element={<AppHomePage />} />
                <Route path=":workspaceId/channels/:channelId" element={<ChannelPage />} />
                <Route path=":workspaceId/dms/:conversationId" element={<ConversationPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Suspense>
      </SessionBootstrap>
    </BrowserRouter>
  );
}
