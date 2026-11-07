/**
 * Top header with section title, privacy status, theme toggle, and actions
 */
import React from 'react';
import { Sun, Moon, Lock, Download, Smartphone } from 'lucide-react';
import { NavTab } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLockVault: () => void;
  onOpenInstallModal: () => void;
  cloudSyncEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  darkMode,
  onToggleDarkMode,
  onLockVault,
  onOpenInstallModal,
  cloudSyncEnabled
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: { title: 'Overview Dashboard', subtitle: 'Your daily productivity and life summary' },
    tasks: { title: 'Task Management', subtitle: 'Organize projects, due dates, and priorities' },
    time: { title: 'Time Tracker', subtitle: 'Track work sessions, duration, and goals' },
    money: { title: 'Money Management', subtitle: 'Track income, expenses, and INR balances' },
    settings: { title: 'Backup & Settings', subtitle: 'Secure local storage, export, and encryption' },
    tests: { title: 'Automated Test Suite', subtitle: 'Verification checks and diagnostic tests' }
  };

  const current = titles[currentTab] || titles.overview;

  return (
    <header className={`border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-200 ${
      darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-emerald-900/10 text-zinc-800'
    }`}>
      <div>
        <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Privacy Status Badge */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          darkMode ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{cloudSyncEnabled ? 'Encrypted Cloud Sync Active' : 'Local-First Private Storage'}</span>
        </div>

        {/* PWA Install Button */}
        <button
          onClick={onOpenInstallModal}
          className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-medium transition-colors ${
            darkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              : 'bg-[#fcfbf9] border-emerald-900/10 text-zinc-700 hover:bg-emerald-50'
          }`}
          title="Install PWA"
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {/* Lock Vault Button */}
        <button
          onClick={onLockVault}
          className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-medium transition-colors ${
            darkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              : 'bg-[#fcfbf9] border-emerald-900/10 text-zinc-700 hover:bg-emerald-50'
          }`}
          title="Lock Vault"
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">Lock Vault</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2.5 rounded-xl border transition-colors ${
            darkMode
              ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700'
              : 'bg-[#fcfbf9] border-emerald-900/10 text-zinc-700 hover:bg-emerald-50'
          }`}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
