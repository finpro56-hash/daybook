/**
 * PWA install modal with platform-specific instructions
 */
import React from 'react';
import { X, Smartphone, Monitor, CheckCircle2, Download } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl relative ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-emerald-900/10 text-zinc-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Install Daybook PWA</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Run offline as a standalone application</p>
          </div>
        </div>

        <div className="space-y-4 my-6 text-sm">
          {/* Android / Chrome */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'}`}>
            <div className="flex items-center gap-2 font-semibold mb-2 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-4 h-4" />
              <span>Android & Desktop Chrome / Edge</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
              <li>Open your browser menu (three dots in top right).</li>
              <li>Select <span className="font-semibold">"Install app"</span> or <span className="font-semibold">"Add to Home screen"</span>.</li>
              <li>Confirm to launch Daybook as a dedicated desktop or mobile app.</li>
            </ol>
          </div>

          {/* iOS Safari */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'}`}>
            <div className="flex items-center gap-2 font-semibold mb-2 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-4 h-4" />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
              <li>Tap the <span className="font-semibold">Share</span> button at the bottom of Safari.</li>
              <li>Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>.</li>
              <li>Tap <span className="font-semibold">Add</span> in the top right corner.</li>
            </ol>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
