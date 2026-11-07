/**
 * Sidebar for desktop and bottom navigation for mobile
 */
import React from 'react';
import { LayoutDashboard, CheckSquare, Clock, Wallet, Settings, ShieldCheck } from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  darkMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, darkMode }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'time', label: 'Time Tracker', icon: <Clock className="w-5 h-5" /> },
    { id: 'money', label: 'Money', icon: <Wallet className="w-5 h-5" /> },
    { id: 'settings', label: 'Backup & Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 border-r shrink-0 transition-colors duration-200 ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-[#fcfbf9] border-emerald-900/10 text-zinc-800'
      }`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Daybook</h1>
            <p className="text-xs text-emerald-600 font-medium">Life OS & Productivity</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 py-2">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  active
                    ? darkMode
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : darkMode
                      ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                      : 'text-zinc-600 hover:bg-emerald-50 hover:text-emerald-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 m-4 rounded-xl border bg-emerald-50/50 dark:bg-zinc-800/50 border-emerald-900/10 dark:border-zinc-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Offline Ready</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">IndexedDB local secure storage active.</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-2 py-2 safe-area-bottom transition-colors duration-200 ${
        darkMode ? 'bg-zinc-900/95 border-zinc-800 backdrop-blur-md' : 'bg-white/95 border-zinc-200 backdrop-blur-md'
      }`}>
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-emerald-100 dark:bg-emerald-950/60' : ''}`}>
                {item.icon}
              </div>
              <span className="mt-0.5 scale-95">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
