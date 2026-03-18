import React, { useMemo, useCallback, useState } from 'react';
import { Home, MessageCircle, Settings, LogOut, ExternalLink, Loader, RefreshCw, LucideIcon } from 'lucide-react';
import { UserProfile, Subscription } from '../../types';
import { useIpc } from '../../hooks/useIpc';
import { getConfig } from '../../utils/ipc';
import { SubscriptionApi } from '../../services/api/subscription.api';

type Tab = 'home' | 'messages' | 'settings';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  user: UserProfile | null;
  subscription: Subscription | null;
  onLogout: () => void;
  backendUrl: string;
  onRefreshSubscription?: () => Promise<void>;
}

interface TabButtonProps {
  tab: Tab;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: (tab: Tab) => void;
}

const TabButton: React.FC<TabButtonProps> = React.memo(({ tab, icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(tab)}
    className={`w-full h-10 rounded-xl flex items-center gap-2.5 px-3 transition-all focus:outline-none ${
      isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span className="text-sm font-garamond">{label}</span>
  </button>
));

TabButton.displayName = 'TabButton';

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ activeTab, onTabChange, user, subscription, onLogout, backendUrl, onRefreshSubscription }) => {
  const ipcRenderer = useIpc();
  const [refreshing, setRefreshing] = useState(false);

  const handleManagePlan = useCallback(async () => {
    if (typeof window !== 'undefined' && window.require) {
      const { shell } = window.require('electron');
      const { FRONTEND_URL } = await getConfig();
      shell.openExternal(`${FRONTEND_URL || 'https://mily.club'}/dashboard`);
    }
  }, []);

  const handleRefreshPlan = useCallback(async () => {
    if (refreshing || !onRefreshSubscription) return;
    setRefreshing(true);
    try {
      await onRefreshSubscription();
    } catch (_) {}
    finally {
      setRefreshing(false);
    }
  }, [refreshing, onRefreshSubscription]);

  const userInitial = useMemo(() => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  }, [user]);

  const planDisplay = useMemo(() => {
    if (!subscription) return 'Free Plan';
    if (subscription.plan === 'free') return 'Free Plan';
    if (subscription.plan === 'pro') return 'Pro Plan';
    return subscription.plan;
  }, [subscription]);

  const usedAmount = useMemo(() => {
    if (!subscription) return '0 / 0 used';
    return `${subscription.used.toLocaleString()} / ${subscription.limit.toLocaleString()} used`;
  }, [subscription]);

  const usagePercentage = useMemo(() => {
    if (!subscription || subscription.limit === 0) return 0;
    return Math.min((subscription.used / subscription.limit) * 100, 100);
  }, [subscription]);

  const isPro = useMemo(() => subscription?.plan === 'pro', [subscription]);

  return (
    <div
      className="w-full md:w-56 bg-neutral-50 border-b md:border-b-0 md:border-r border-neutral-200 flex flex-row md:flex-col h-auto md:h-full"
      style={{ paddingTop: '60px' }}
    >
      <div className="flex items-center gap-2.5 mb-4 md:mb-6 px-3 flex-shrink-0">
        <div className="h-10 w-10 flex items-center justify-center rounded-lg overflow-hidden">
          <img src="public/logo.png" alt="Mily Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-garamond text-neutral-900">Mily</h1>
      </div>

      <div className="flex-1 px-2 space-y-1.5 overflow-y-auto min-h-0 hidden md:block">
        <TabButton tab="home" icon={Home} label="Home" isActive={activeTab === 'home'} onClick={onTabChange} />
        <TabButton tab="messages" icon={MessageCircle} label="Messages" isActive={activeTab === 'messages'} onClick={onTabChange} />
        <TabButton tab="settings" icon={Settings} label="Settings" isActive={activeTab === 'settings'} onClick={onTabChange} />
      </div>

      <div className="hidden md:block px-2 pb-4 space-y-3 mt-auto flex-shrink-0">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-garamond text-neutral-600">Plan</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-garamond px-2.5 py-1 rounded-full whitespace-nowrap ${
                isPro ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {planDisplay}
              </span>
              {onRefreshSubscription && (
                <button
                  onClick={handleRefreshPlan}
                  disabled={refreshing}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all focus:outline-none disabled:opacity-40"
                  title="Refresh plan"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-garamond text-neutral-900 whitespace-nowrap">{usedAmount}</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${usagePercentage}%` }} />
          </div>

          <button
            onClick={handleManagePlan}
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-all flex items-center justify-center gap-1.5 focus:outline-none"
          >
            {isPro ? 'Manage Plan' : 'Upgrade to Pro'}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-neutral-200">
          <div className="h-9 w-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-garamond font-semibold text-base flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-garamond text-neutral-900 truncate">{user?.email || 'User'}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-all focus:outline-none flex-shrink-0"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
