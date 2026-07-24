import { Menu, Bell, Search, Settings as SettingsIcon, LogOut, X, Sun, Moon } from 'lucide-react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { WorkspaceSwitcher } from '@/widgets/workspace-switcher';
import { ChannelList } from '@/widgets/channel-list';
import { ThreadPanel } from '@/widgets/thread-panel';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { useLogout, useAuthStore } from '@/features/auth';
import { useUiStore } from '@/shared/lib/ui-store';
import { useSocket } from '@/shared/lib/socket';
import { joinWorkspaceRoom } from '@/shared/lib/socket';
import { useEffect, useMemo, useState } from 'react';
import { CommandPalette } from '@/features/command-palette';
import { SearchDialog } from '@/features/search';
import { NotificationsPanel } from '@/features/notifications';
import { cn } from '@/shared/lib/cn';

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { workspaceId, channelId, conversationId } = useParams();
  const navigate = useNavigate();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const threadMessageId = useUiStore((s) => s.threadMessageId);
  const setLocale = useUiStore((s) => s.setLocale);
  const { setTheme, resolvedTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useSocket();

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

  useEffect(() => {
    if (workspaceId) joinWorkspaceRoom(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main" className="skip-link">
        {t('app.skipToContent')}
      </a>

      <aside className="hidden w-[72px] shrink-0 bg-sidebar md:flex md:flex-col">
        <div className="flex items-center justify-center py-4">
          <Link to="/" className="group relative inline-flex" aria-label={t('app.name')}>
            <img
              src="/favicon.svg"
              alt=""
              className="h-8 w-8 transition-transform group-hover:scale-105"
            />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-pulse-teal animate-pulse-dot" />
          </Link>
        </div>
        <WorkspaceSwitcher />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-sidebar transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-3 md:hidden">
          <span className="font-display font-semibold text-sidebar-foreground">
            {t('app.name')}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="text-sidebar-foreground hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('nav.closeMenu')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ChannelList />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            aria-label={t('nav.openMenu')}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-display text-sm font-semibold md:hidden">{t('app.name')}</div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={t('nav.search')}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t('nav.notifications')}
              onClick={() => setNotifOpen(true)}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('nav.settings')}
                  className="relative"
                >
                  <Avatar className="h-7 w-7">
                    {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-background bg-pulse-teal" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {t('common.theme')}:{' '}
                  {resolvedTheme === 'dark' ? t('common.dark') : t('common.light')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const next = i18n.language === 'en' ? 'ru' : 'en';
                    void i18n.changeLanguage(next);
                    setLocale(next as 'en' | 'ru');
                  }}
                >
                  {t('common.language')}: {i18n.language === 'ru' ? 'RU' : 'EN'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await logout.mutateAsync();
                    navigate('/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                  {user?.displayName ? ` (${user.displayName})` : ''}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div id="main" className="flex min-h-0 flex-1">
          <Outlet />
          {threadMessageId ? (
            <ThreadPanel
              channelId={channelId}
              conversationId={conversationId}
              parentId={threadMessageId}
            />
          ) : null}
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} workspaceId={workspaceId} />
      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
