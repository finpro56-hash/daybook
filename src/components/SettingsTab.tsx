/**
 * Backup and Settings Tab component with App Preferences, Vault Lock, and PWA Installation
 */
import React, { useState } from 'react';
import { Workspace } from '../types';
import { encryptData, decryptData, validatePassphrase } from '../utils/crypto';
import { usePWAInstall } from '../utils/usePWAInstall';
import {
  Settings,
  Download,
  Upload,
  ShieldCheck,
  Lock,
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface SettingsTabProps {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLockVault: () => void;
  onOpenInstallModal: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  workspace,
  onUpdateWorkspace,
  darkMode,
  onToggleDarkMode,
  onLockVault,
  onOpenInstallModal
}) => {
  const [goalHours, setGoalHours] = useState(workspace.goalHours);
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');

  // PWA install hook
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Encryption export/import state
  const [passphrase, setPassphrase] = useState('');
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<Workspace | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkspace({ ...workspace, goalHours: Number(goalHours) });
    setMessage({ type: 'success', text: 'Daily work goal updated successfully.' });
  };

  const handleAddExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseCat.trim()) return;
    if (workspace.expenseCategories.includes(newExpenseCat.trim())) return;
    onUpdateWorkspace({
      ...workspace,
      expenseCategories: [...workspace.expenseCategories, newExpenseCat.trim()]
    });
    setNewExpenseCat('');
  };

  const handleDeleteExpenseCategory = (cat: string) => {
    onUpdateWorkspace({
      ...workspace,
      expenseCategories: workspace.expenseCategories.filter((c) => c !== cat)
    });
  };

  const handleAddIncomeCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeCat.trim()) return;
    if (workspace.incomeCategories.includes(newIncomeCat.trim())) return;
    onUpdateWorkspace({
      ...workspace,
      incomeCategories: [...workspace.incomeCategories, newIncomeCat.trim()]
    });
    setNewIncomeCat('');
  };

  const handleDeleteIncomeCategory = (cat: string) => {
    onUpdateWorkspace({
      ...workspace,
      incomeCategories: workspace.incomeCategories.filter((c) => c !== cat)
    });
  };

  // Plain JSON Export
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workspace, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daybook_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Encrypted Backup Export
  const handleExportEncrypted = async () => {
    const val = validatePassphrase(passphrase);
    if (!val.valid) {
      setMessage({ type: 'error', text: val.error || 'Invalid passphrase' });
      return;
    }

    try {
      const encrypted = await encryptData(workspace, passphrase);
      const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(encrypted);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `daybook_encrypted_${new Date().toISOString().split('T')[0]}.enc`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMessage({ type: 'success', text: 'Encrypted backup downloaded successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Encryption failed' });
    }
  };

  // File Import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportFileContent(content);
      
      try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.format === 'daybook-workspace') {
          setImportPreviewData(parsed);
          setMessage({ type: 'success', text: 'Plain JSON backup loaded for review.' });
          return;
        }
      } catch {
        // Not plain JSON, might be encrypted
      }

      setImportPreviewData(null);
      setMessage({ type: 'success', text: 'Encrypted backup file loaded. Enter passphrase to decrypt.' });
    };
    reader.readAsText(file);
  };

  const handleDecryptImport = async () => {
    if (!importFileContent) return;
    try {
      const decrypted = await decryptData(importFileContent, decryptPassphrase);
      if (decrypted && (decrypted as Workspace).format === 'daybook-workspace') {
        setImportPreviewData(decrypted as Workspace);
        setMessage({ type: 'success', text: 'Encrypted backup successfully decrypted for review.' });
      } else {
        setMessage({ type: 'error', text: 'Invalid decrypted workspace structure.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Decryption failed.' });
    }
  };

  const handleConfirmImport = () => {
    if (!importPreviewData) return;
    onUpdateWorkspace(importPreviewData);
    setImportFileContent(null);
    setImportPreviewData(null);
    setDecryptPassphrase('');
    setMessage({ type: 'success', text: 'Workspace successfully restored from backup.' });
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* App Preferences & Controls Section */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base">App Controls & Preferences</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage theme appearance, security vault, and PWA installation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Theme Switcher */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Theme</span>
                {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <h5 className="font-semibold text-sm mb-1">{darkMode ? 'Dark Theme' : 'Light Theme'}</h5>
              <p className="text-xs text-zinc-500 mb-4">
                {darkMode ? 'Comfortable deep contrast for focused sessions.' : 'Calm, soft cream & green minimal aesthetic.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                darkMode
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600'
                  : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200 shadow-sm'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              Switch to {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* Lock Vault Control */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Security</span>
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <h5 className="font-semibold text-sm mb-1">Lock Device Vault</h5>
              <p className="text-xs text-zinc-500 mb-4">
                Locks Daybook immediately. Requires your 12+ character passphrase to reopen.
              </p>
            </div>
            <button
              type="button"
              onClick={onLockVault}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Lock Vault Now
            </button>
          </div>

          {/* PWA App Installation */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Progressive Web App</span>
                <Smartphone className="w-5 h-5 text-emerald-600" />
              </div>
              <h5 className="font-semibold text-sm mb-1">
                {isInstalled ? 'App Installed' : 'Install Daybook App'}
              </h5>
              <p className="text-xs text-zinc-500 mb-4">
                {isInstalled
                  ? 'Daybook is active in standalone app mode with offline storage.'
                  : 'Install to your home screen or desktop to run standalone with zero URL bars.'}
              </p>
            </div>

            {isInstalled ? (
              <div className="py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Active Standalone PWA
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                Install Daybook PWA
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                Install Guide & Options
              </button>
            )}
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <h4 className="font-bold text-base mb-4">General Settings</h4>
        <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Daily Work Goal (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={goalHours}
              onChange={(e) => setGoalHours(Number(e.target.value))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
              }`}
              required
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Save Goal
          </button>
        </form>
      </div>

      {/* Category Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <h4 className="font-bold text-base mb-4">Expense Categories</h4>
          <form onSubmit={handleAddExpenseCategory} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              placeholder="New expense category..."
              className={`flex-1 px-4 py-2 rounded-xl border text-sm ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
              }`}
            />
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {workspace.expenseCategories.map((cat) => (
              <div key={cat} className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
              }`}>
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteExpenseCategory(cat);
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete category"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Income Categories */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <h4 className="font-bold text-base mb-4">Income Categories</h4>
          <form onSubmit={handleAddIncomeCategory} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              placeholder="New income category..."
              className={`flex-1 px-4 py-2 rounded-xl border text-sm ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
              }`}
            />
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {workspace.incomeCategories.map((cat) => (
              <div key={cat} className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
              }`}>
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteIncomeCategory(cat);
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete category"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backup, Encryption & Import / Export */}
      <div className={`p-6 rounded-3xl border space-y-6 ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <h4 className="font-bold text-base">Backups & Encryption</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
          }`}>
            <h5 className="font-semibold text-sm">Export Workspace</h5>
            <p className="text-xs text-zinc-500">Download a plain JSON backup or an AES-256-GCM encrypted backup.</p>

            <button
              type="button"
              onClick={handleExportJson}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Plain JSON
            </button>

            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Encrypted Backup Passphrase (min 12 chars)
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter 12+ char passphrase..."
                className={`w-full px-3 py-2 rounded-xl border text-xs ${
                  darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              />
              <button
                type="button"
                onClick={handleExportEncrypted}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Export Encrypted (.enc)
              </button>
            </div>
          </div>

          {/* Import Options */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
          }`}>
            <h5 className="font-semibold text-sm">Import & Restore Workspace</h5>
            <p className="text-xs text-zinc-500">Select a JSON or .enc backup file to review and restore.</p>

            <input
              type="file"
              accept=".json,.enc"
              onChange={handleFileChange}
              className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
            />

            {importFileContent && !importPreviewData && (
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Enter Passphrase to Decrypt
                </label>
                <input
                  type="password"
                  value={decryptPassphrase}
                  onChange={(e) => setDecryptPassphrase(e.target.value)}
                  placeholder="Passphrase..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleDecryptImport}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Decrypt & Review
                </button>
              </div>
            )}

            {importPreviewData && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 space-y-2 text-xs">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Backup Verified successfully!</p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Tasks: {importPreviewData.tasks.length} | Logs: {importPreviewData.logs.length} | Money Records: {importPreviewData.money.length}
                </p>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white font-medium shadow transition-all cursor-pointer"
                >
                  Confirm & Replace Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
