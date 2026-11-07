/**
 * Top header with section title and privacy status
 */
import React from 'react';
import { NavTab } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  darkMode: boolean;
  cloudSyncEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  darkMode,
  cloudSyncEnabled
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: { title: 'Overview Dashboard', subtitle: 'Your daily productivity and life summary' },
    tasks: { title: 'Task Management', subtitle: 'Organize projects, due dates, and priorities' },
    time: { title: 'Time Tracker', subtitle: 'Track work sessions, duration, and goals' },
    money: { title: 'Money Management', subtitle: 'Track income, expenses, and INR balances' },
    settings: { title: 'Backup & Settings', subtitle: 'Secure local storage, export, and encryption' }
  };

  const current = titles[currentTab] || titles.overview;

  return (
    <header className={`hidden md:flex items-center justify-between border-b px-6 py-4 gap-4 transition-colors duration-200 ${
      darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-emerald-900/10 text-zinc-800'
    }`}>
      <div>
        <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Privacy Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          darkMode ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{cloudSyncEnabled ? 'Encrypted Cloud Sync Active' : 'Local-First Private Storage'}</span>
        </div>
      </div>
    </header>
  );
};
