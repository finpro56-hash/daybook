/**
 * Overview dashboard component
 */
import React, { useState } from 'react';
import { Workspace, Task } from '../types';
import { formatINR } from '../utils/money';
import { formatDuration, calculateLogDurationSeconds } from '../utils/time';
import { CheckCircle2, Clock, Wallet, TrendingUp, TrendingDown, Play, Square, Calendar } from 'lucide-react';

interface OverviewTabProps {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
  darkMode: boolean;
  onStartTimerForTask: (task: Task) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ workspace, onUpdateWorkspace, darkMode, onStartTimerForTask }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Calculations for today
  const todayTasks = workspace.tasks.filter((t) => t.due === selectedDate);
  const completedTodayCount = todayTasks.filter((t) => t.done).length;

  // Time logged today
  const todayLogs = workspace.logs.filter((l) => l.start.startsWith(selectedDate));
  const todaySeconds = todayLogs.reduce((acc, log) => acc + calculateLogDurationSeconds(log), 0);
  const goalSeconds = workspace.goalHours * 3600;
  const progressPercent = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100));

  // Monthly income & expenses
  const currentMonthPrefix = selectedDate.substring(0, 7); // YYYY-MM
  const monthTransactions = workspace.money.filter((m) => m.date.startsWith(currentMonthPrefix));
  const monthlyIncomeCents = monthTransactions.filter((m) => m.income).reduce((acc, m) => acc + m.cents, 0);
  const monthlyExpenseCents = monthTransactions.filter((m) => !m.income).reduce((acc, m) => acc + m.cents, 0);
  const monthlyBalanceCents = monthlyIncomeCents - monthlyExpenseCents;

  // Timer controls
  const timer = workspace.timer;

  const handleStartTimer = (task?: Task) => {
    const updatedTimer = {
      taskId: task ? task.id : null,
      label: task ? task.title : 'Quick Focus Session',
      startTime: Date.now(),
      running: true,
      elapsedSeconds: timer.elapsedSeconds
    };
    onUpdateWorkspace({ ...workspace, timer: updatedTimer });
  };

  const handleStopTimer = () => {
    if (!timer.startTime) return;
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000) + timer.elapsedSeconds;
    if (elapsed > 5) {
      const newLog = {
        id: 'log-' + Date.now(),
        taskId: timer.taskId,
        label: timer.label || 'Focus Session',
        start: new Date(timer.startTime).toISOString(),
        end: new Date().toISOString()
      };
      onUpdateWorkspace({
        ...workspace,
        logs: [newLog, ...workspace.logs],
        timer: { taskId: null, label: '', startTime: null, running: false, elapsedSeconds: 0 }
      });
    } else {
      onUpdateWorkspace({
        ...workspace,
        timer: { taskId: null, label: '', startTime: null, running: false, elapsedSeconds: 0 }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Date selector & Header banner */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Productivity Overview</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Reviewing stats for {selectedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-zinc-500">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm font-medium ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-900'
            }`}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks completed */}
        <div className={`p-5 rounded-3xl border transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tasks Completed</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight mb-1">
            {completedTodayCount} <span className="text-sm font-normal text-zinc-400">/ {todayTasks.length}</span>
          </div>
          <p className="text-xs text-zinc-500">Scheduled for today</p>
        </div>

        {/* Time logged */}
        <div className={`p-5 rounded-3xl border transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Time Logged</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight mb-1">{formatDuration(todaySeconds)}</div>
          <p className="text-xs text-zinc-500">Goal: {workspace.goalHours} hours ({progressPercent}%)</p>
        </div>

        {/* Monthly Income */}
        <div className={`p-5 rounded-3xl border transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Monthly Income</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight mb-1 truncate">{formatINR(monthlyIncomeCents)}</div>
          <p className="text-xs text-emerald-600 font-medium">Inflows this month</p>
        </div>

        {/* Monthly Balance */}
        <div className={`p-5 rounded-3xl border transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Net Balance</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight mb-1 truncate ${monthlyBalanceCents >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatINR(monthlyBalanceCents)}
          </div>
          <p className="text-xs text-zinc-500">Expenses: {formatINR(monthlyExpenseCents)}</p>
        </div>
      </div>

      {/* Goal Progress & Focus Timer Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily 8-Hour Goal Progress */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border flex flex-col justify-between ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-base">Daily Work Goal ({workspace.goalHours}h Target)</h4>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {progressPercent}% Complete
              </span>
            </div>
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500">
              You have logged <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDuration(todaySeconds)}</span> out of your {workspace.goalHours}-hour target for today. Keep up the focused momentum!
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Sessions Today</span>
              <span className="text-lg font-bold">{todayLogs.length}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Tasks Due Today</span>
              <span className="text-lg font-bold">{todayTasks.length}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Remaining Goal</span>
              <span className="text-lg font-bold">{Math.max(0, workspace.goalHours - (todaySeconds / 3600)).toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* Current Focus Timer Widget */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-base">Focus Timer</h4>
              <span className={`w-2.5 h-2.5 rounded-full ${timer.running ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`}></span>
            </div>

            <div className="text-center my-6">
              <span className="text-3xl font-mono font-bold tracking-tight">
                {timer.running ? 'Active Session' : 'Ready'}
              </span>
              <p className="text-xs text-zinc-500 mt-1 truncate">
                {timer.label || 'No active task selected'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {timer.running ? (
              <button
                onClick={handleStopTimer}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop & Save Session
              </button>
            ) : (
              <button
                onClick={() => handleStartTimer()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Focus Timer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <h4 className="font-bold text-base mb-4">Today's Tasks</h4>
        {todayTasks.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No tasks scheduled for today. Add a new task in Task Management.</p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  darkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => {
                      const updatedTasks = workspace.tasks.map((t) =>
                        t.id === task.id ? { ...t, done: !t.done } : t
                      );
                      onUpdateWorkspace({ ...workspace, tasks: updatedTasks });
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className={`text-sm font-medium ${task.done ? 'line-through text-zinc-400' : ''}`}>
                      {task.title}
                    </p>
                    <span className="text-[11px] text-zinc-500">{task.project} • {task.priority} Priority</span>
                  </div>
                </div>

                {!timer.running && !task.done && (
                  <button
                    type="button"
                    onClick={() => onStartTimerForTask(task)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Track
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
