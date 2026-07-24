import { Menu, Bell, Search, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { WorkspaceSwitcher } from '@/widgets/workspace-switcher';
import { ChannelList } from '@/widgets/channel-list';
import { ThreadPanel } from '@/widgets/thread-panel';
import {
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
import { useEffect, useState } from 'react';
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
  const { setTheme, theme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useSocket();

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
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
        </div>
        <WorkspaceSwitcher />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-sidebar transition-transform md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-3 md:hidden">
          <span className="font-display font-semibold text-sidebar-foreground">Pulse</span>
          <Button
            size="icon"
            variant="ghost"
            className="text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </Button>
        </div>
        <ChannelList />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-3">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-display text-sm font-semibold md:hidden">Pulse</div>
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
                <Button size="icon" variant="ghost" aria-label={t('nav.settings')}>
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {t('common.theme')}: {theme}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const next = i18n.language === 'en' ? 'ru' : 'en';
                    void i18n.changeLanguage(next);
                    setLocale(next);
                  }}
                >
                  {t('common.language')}: {i18n.language}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await logout.mutateAsync();
                    navigate('/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')} ({user?.displayName})
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
