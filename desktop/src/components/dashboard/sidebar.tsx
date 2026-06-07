import React, { useMemo } from 'react';
import { Home, MessageCircle, Settings, LogOut, LucideIcon } from 'lucide-react';

type Tab = 'home' | 'messages' | 'settings';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userName: string | null;
  onLogout: () => void;
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
  ({ activeTab, onTabChange, userName, onLogout }) => {

  const userInitial = useMemo(() => {
    if (userName) return userName.charAt(0).toUpperCase();
    return 'M';
  }, [userName]);

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

      <div className="hidden md:block px-2 pb-4 mt-auto flex-shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-neutral-200">
          <div className="h-9 w-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-garamond font-semibold text-base flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-garamond text-neutral-900 truncate">{userName || 'User'}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-all focus:outline-none flex-shrink-0"
            title="Reset app"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
