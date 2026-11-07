/**
 * IndexedDB storage engine with cross-tab sync and local fallback
 */
import { Workspace, Task, WorkLog, MoneyRecord, TimerState } from '../types';

const DB_NAME = 'daybook_db';
const STORE_NAME = 'workspace';
const WORKSPACE_KEY = 'main_workspace';
const BROADCAST_CHANNEL = 'daybook-sync-channel';

// Generate unique session ID so this tab ignores its own broadcast messages
const SESSION_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : 'session-' + Math.random().toString(36).slice(2);

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing & Rent',
  'Utilities',
  'Transport',
  'Shopping',
  'Health & Medical',
  'Entertainment',
  'Subscriptions',
  'Other Expense'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Gifts',
  'Other Income'
];

export const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: 'Review quarterly financial budget', project: 'Finance', due: new Date().toISOString().split('T')[0], done: false, priority: 'High' },
  { id: 't2', title: 'Prepare design system components', project: 'Engineering', due: new Date().toISOString().split('T')[0], done: false, priority: 'Medium' },
  { id: 't3', title: 'Send weekly progress report', project: 'Management', due: new Date().toISOString().split('T')[0], done: true, priority: 'Low' }
];

export const DEFAULT_MONEY: MoneyRecord[] = [
  { id: 'm1', title: 'Monthly Salary', category: 'Salary', cents: 9500000, income: true, date: new Date().toISOString().split('T')[0] },
  { id: 'm2', title: 'Grocery Supermarket', category: 'Food & Dining', cents: 450000, income: false, date: new Date().toISOString().split('T')[0] }
];

export const DEFAULT_WORKSPACE: Workspace = {
  format: 'daybook-workspace',
  version: 1,
  tasks: DEFAULT_TASKS,
  logs: [],
  money: DEFAULT_MONEY,
  goalHours: 8,
  currency: '₹',
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  timer: {
    taskId: null,
    label: '',
    startTime: null,
    running: false,
    elapsedSeconds: 0
  },
  lastExport: new Date().toISOString()
};

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
  }
} catch {
  // BroadcastChannel not supported in some test runners
}

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function loadWorkspace(): Promise<Workspace> {
  // 1. First attempt to load from IndexedDB
  try {
    const db = await openIndexedDB();
    const data = await new Promise<Workspace | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(WORKSPACE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (data && data.format === 'daybook-workspace') {
      // Also ensure localStorage is in sync as backup
      try {
        localStorage.setItem('daybook_workspace', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to localStorage', err);
  }

  // 2. If IndexedDB had no record or errored, check localStorage
  try {
    const local = localStorage.getItem('daybook_workspace');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.format === 'daybook-workspace') {
        // Sync back to IndexedDB asynchronously
        openIndexedDB().then((db) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(parsed, WORKSPACE_KEY);
        }).catch(() => {});
        return parsed;
      }
    }
  } catch (err) {
    console.warn('localStorage read error', err);
  }

  // 3. First time launch: seed default workspace to both stores
  try {
    localStorage.setItem('daybook_workspace', JSON.stringify(DEFAULT_WORKSPACE));
    openIndexedDB().then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(DEFAULT_WORKSPACE, WORKSPACE_KEY);
    }).catch(() => {});
  } catch {}

  return DEFAULT_WORKSPACE;
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const updated = { ...workspace, lastExport: new Date().toISOString() };
  
  // 1. Immediately save to localStorage (synchronous & reliable)
  try {
    localStorage.setItem('daybook_workspace', JSON.stringify(updated));
  } catch (err) {
    console.warn('localStorage save error', err);
  }

  // 2. Save to IndexedDB
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updated, WORKSPACE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save error', err);
  }

  // 3. Notify other tabs (marking with SESSION_ID so this tab ignores it)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'WORKSPACE_UPDATED',
        senderId: SESSION_ID,
        timestamp: Date.now()
      });
    } catch {
      // ignore
    }
  }
}

export function subscribeToSync(onSync: () => void): () => void {
  if (!broadcastChannel) return () => {};
  const listener = (event: MessageEvent) => {
    if (event.data && event.data.type === 'WORKSPACE_UPDATED') {
      // Ignore broadcast messages emitted by this same session
      if (event.data.senderId === SESSION_ID) {
        return;
      }
      onSync();
    }
  };
  broadcastChannel.addEventListener('message', listener);
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', listener);
    }
  };
}
