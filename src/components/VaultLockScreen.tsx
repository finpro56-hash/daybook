/**
 * Vault lock screen for encryption passphrase entry
 */
import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface VaultLockScreenProps {
  onUnlock: (passphrase: string) => Promise<boolean>;
  darkMode: boolean;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({ onUnlock, darkMode }) => {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) {
      setError('Please enter your encryption passphrase.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const success = await onUnlock(passphrase);
      if (!success) {
        setError('Incorrect passphrase. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Unlock failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
      darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f8f6f0] text-zinc-900'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-xl transition-all ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10'
      }`}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Daybook Vault Locked</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enter your 12+ character AES-256-GCM encryption passphrase to unlock your secure workspace.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              Passphrase
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter encryption passphrase..."
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
                autoFocus
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Note: There is no passphrase reset backdoor for maximum security.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Decrypting Vault...' : 'Unlock Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
