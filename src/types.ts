export interface Task {
  id: string;
  title: string;
  project: string;
  due: string; // YYYY-MM-DD
  done: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export interface WorkLog {
  id: string;
  taskId: string | null;
  label: string;
  start: string; // ISO string
  end: string; // ISO string
}

export interface MoneyRecord {
  id: string;
  title: string;
  category: string;
  cents: number; // Positive safe integer in paise/cents
  income: boolean;
  date: string; // YYYY-MM-DD
}

export interface TimerState {
  taskId: string | null;
  label: string;
  startTime: number | null; // timestamp ms or null
  running: boolean;
  elapsedSeconds: number;
}

export interface Workspace {
  format: 'daybook-workspace';
  version: number;
  tasks: Task[];
  logs: WorkLog[];
  money: MoneyRecord[];
  goalHours: number;
  currency: string;
  expenseCategories: string[];
  incomeCategories: string[];
  timer: TimerState;
  lastExport: string;
}

export type NavTab = 'overview' | 'tasks' | 'time' | 'money' | 'settings';
