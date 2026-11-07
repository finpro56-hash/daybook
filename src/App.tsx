/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Workspace, NavTab, Task } from './types';
import { loadWorkspace, saveWorkspace, subscribeToSync } from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { TasksTab } from './components/TasksTab';
import { TimeTab } from './components/TimeTab';
import { MoneyTab } from './components/MoneyTab';
import { SettingsTab } from './components/SettingsTab';
import { TestRunnerTab } from './components/TestRunnerTab';
import { VaultLockScreen } from './components/VaultLockScreen';
import { PwaInstallModal } from './components/PwaInstallModal';

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('daybook_dark_mode');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isLocked, setIsLocked] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Load initial workspace
  useEffect(() => {
    // Clear stale service worker caches
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'daybook-v2') {
            caches.delete(key);
          }
        });
      });
    }

    loadWorkspace().then((ws) => {
      setWorkspace(ws);
    });

    // Subscribe to cross-tab sync
    const unsubscribe = subscribeToSync(() => {
      loadWorkspace().then((ws) => {
        setWorkspace(ws);
      });
    });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update();
      }).catch(() => {
        // ignore registration failure in dev
      });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daybook_dark_mode', JSON.stringify(darkMode));
    } catch {
      // ignore
    }
  }, [darkMode]);

  const handleUpdateWorkspace = (newWs: Workspace) => {
    setWorkspace(newWs);
    saveWorkspace(newWs);
  };

  const handleUnlock = async (passphrase: string): Promise<boolean> => {
    if (passphrase && passphrase.length >= 12) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleStartTimerForTask = (task: Task) => {
    if (!workspace) return;
    const updatedTimer = {
      taskId: task.id,
      label: task.title,
      startTime: Date.now(),
      running: true,
      elapsedSeconds: 0
    };
    handleUpdateWorkspace({ ...workspace, timer: updatedTimer });
    setCurrentTab('time');
  };

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          <p className="text-xs text-zinc-400 font-medium">Loading Daybook secure workspace...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <VaultLockScreen onUnlock={handleUnlock} darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f5f3ee] text-zinc-900'
    }`}>
      {/* Sidebar / Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} darkMode={darkMode} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <Header
          currentTab={currentTab}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onLockVault={() => setIsLocked(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          cloudSyncEnabled={false}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewTab workspace={workspace} onUpdateWorkspace={handleUpdateWorkspace} darkMode={darkMode} onStartTimerForTask={handleStartTimerForTask} />
          )}
          {currentTab === 'tasks' && (
            <TasksTab workspace={workspace} onUpdateWorkspace={handleUpdateWorkspace} darkMode={darkMode} onStartTimerForTask={handleStartTimerForTask} />
          )}
          {currentTab === 'time' && (
            <TimeTab workspace={workspace} onUpdateWorkspace={handleUpdateWorkspace} darkMode={darkMode} />
          )}
          {currentTab === 'money' && (
            <MoneyTab workspace={workspace} onUpdateWorkspace={handleUpdateWorkspace} darkMode={darkMode} />
          )}
          {currentTab === 'settings' && (
            <SettingsTab workspace={workspace} onUpdateWorkspace={handleUpdateWorkspace} darkMode={darkMode} onOpenInstallModal={() => setIsInstallModalOpen(true)} />
          )}
          {currentTab === 'tests' && (
            <TestRunnerTab workspace={workspace} darkMode={darkMode} />
          )}
        </main>
      </div>

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
