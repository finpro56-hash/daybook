/**
 * Time Tracker Tab component with enhanced mobile responsiveness
 */
import React, { useState, useEffect } from 'react';
import { Workspace, Task, WorkLog } from '../types';
import { formatDuration, calculateLogDurationSeconds, checkOverlap, splitLogAcrossMidnight } from '../utils/time';
import { Clock, Play, Square, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface TimeTabProps {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
  darkMode: boolean;
}

export const TimeTab: React.FC<TimeTabProps> = ({ workspace, onUpdateWorkspace, darkMode }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [customLabel, setCustomLabel] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual entry state
  const [manualStart, setManualStart] = useState(new Date().toISOString().slice(0, 16));
  const [manualEnd, setManualEnd] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [manualTaskId, setManualTaskId] = useState<string>('');
  const [manualLabel, setManualLabel] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const timer = workspace.timer;

  // Live timer tick effect
  const [liveSeconds, setLiveSeconds] = useState(0);
  useEffect(() => {
    let interval: any = null;
    if (timer.running && timer.startTime) {
      const updateLive = () => {
        const elapsed = Math.floor((Date.now() - timer.startTime!) / 1000) + timer.elapsedSeconds;
        setLiveSeconds(elapsed);
      };
      updateLive();
      interval = setInterval(updateLive, 1000);
    } else {
      setLiveSeconds(timer.elapsedSeconds);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleStartTimer = () => {
    const task = workspace.tasks.find((t) => t.id === selectedTaskId);
    const label = task ? task.title : (customLabel || 'General Focus Session');

    const updatedTimer = {
      taskId: selectedTaskId || null,
      label,
      startTime: Date.now(),
      running: true,
      elapsedSeconds: 0
    };
    onUpdateWorkspace({ ...workspace, timer: updatedTimer });
  };

  const handleStopTimer = () => {
    if (!timer.startTime) return;
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000) + timer.elapsedSeconds;
    if (elapsed > 2) {
      const startIso = new Date(timer.startTime).toISOString();
      const endIso = new Date().toISOString();
      const rawLog: WorkLog = {
        id: 'log-' + Date.now(),
        taskId: timer.taskId,
        label: timer.label || 'Focus Session',
        start: startIso,
        end: endIso
      };

      const splitLogs = splitLogAcrossMidnight(rawLog);

      onUpdateWorkspace({
        ...workspace,
        logs: [...splitLogs, ...workspace.logs],
        timer: { taskId: null, label: '', startTime: null, running: false, elapsedSeconds: 0 }
      });
    } else {
      onUpdateWorkspace({
        ...workspace,
        timer: { taskId: null, label: '', startTime: null, running: false, elapsedSeconds: 0 }
      });
    }
  };

  const handleSwitchTask = (newTaskId: string) => {
    if (timer.running && timer.startTime) {
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000) + timer.elapsedSeconds;
      const startIso = new Date(timer.startTime).toISOString();
      const endIso = new Date().toISOString();
      const rawLog: WorkLog = {
        id: 'log-' + Date.now(),
        taskId: timer.taskId,
        label: timer.label || 'Focus Session',
        start: startIso,
        end: endIso
      };
      const splitLogs = splitLogAcrossMidnight(rawLog);

      const task = workspace.tasks.find((t) => t.id === newTaskId);
      const label = task ? task.title : 'General Focus Session';

      onUpdateWorkspace({
        ...workspace,
        logs: [...splitLogs, ...workspace.logs],
        timer: {
          taskId: newTaskId || null,
          label,
          startTime: Date.now(),
          running: true,
          elapsedSeconds: 0
        }
      });
    }
    setSelectedTaskId(newTaskId);
  };

  const handleDeleteLog = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = workspace.logs.filter((l) => String(l.id) !== String(id));
    onUpdateWorkspace({ ...workspace, logs: updated });
  };

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const startIso = new Date(manualStart).toISOString();
    const endIso = new Date(manualEnd).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setManualError('End time must be after start time.');
      return;
    }

    if (checkOverlap(startIso, endIso, workspace.logs)) {
      setManualError('This time session overlaps with an existing logged session.');
      return;
    }

    const task = workspace.tasks.find((t) => t.id === manualTaskId);
    const label = task ? task.title : (manualLabel || 'Manual Work Session');

    const rawLog: WorkLog = {
      id: 'log-' + Date.now(),
      taskId: manualTaskId || null,
      label,
      start: startIso,
      end: endIso
    };

    const splitLogs = splitLogAcrossMidnight(rawLog);

    onUpdateWorkspace({
      ...workspace,
      logs: [...splitLogs, ...workspace.logs]
    });
    setIsManualModalOpen(false);
  };

  const unfinishedTasks = workspace.tasks.filter((t) => !t.done);

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Active Tracker Control Banner */}
      <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 ${timer.running ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {timer.running ? 'Timer Active' : 'Tracker Ready'}
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight truncate">
            {formatDuration(liveSeconds)}
          </div>

          <p className="text-xs text-zinc-500 truncate max-w-md">
            {timer.running ? `Tracking: ${timer.label}` : 'Select a task or enter custom label to begin'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {!timer.running ? (
            <>
              <select
                value={selectedTaskId}
                onChange={(e) => handleSwitchTask(e.target.value)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium w-full sm:w-64 max-w-full truncate cursor-pointer ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-900'
                }`}
              >
                <option value="">Select active task...</option>
                {unfinishedTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} ({t.project})</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleStartTimer}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                Start Timer
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStopTimer}
              className="py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Square className="w-4 h-4 fill-current shrink-0" />
              Stop & Save
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Work Session History */}
      <div className={`p-5 sm:p-6 rounded-3xl border ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <h4 className="font-bold text-base mb-4">Work Session History ({workspace.logs.length})</h4>
        {workspace.logs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-8 text-center">No work sessions logged yet.</p>
        ) : (
          <div className="space-y-3">
            {workspace.logs.map((log) => {
              const durationSecs = calculateLogDurationSeconds(log);
              const startDate = new Date(log.start);
              const endDate = new Date(log.end);

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{log.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <span className="font-mono font-bold text-sm px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {formatDuration(durationSecs)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLog(log.id, e)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl my-auto ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-emerald-900/10 text-zinc-900'
          }`}>
            <h3 className="font-bold text-lg mb-4">Add Manual Work Session</h3>

            {manualError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleSaveManualLog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Related Task (Optional)</label>
                <select
                  value={manualTaskId}
                  onChange={(e) => setManualTaskId(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm cursor-pointer ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                >
                  <option value="">None / Custom label</option>
                  {workspace.tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title} ({t.project})</option>
                  ))}
                </select>
              </div>

              {!manualTaskId && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Session Label</label>
                  <input
                    type="text"
                    value={manualLabel}
                    onChange={(e) => setManualLabel(e.target.value)}
                    placeholder="e.g. Deep Work Review..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Start Time & Date</label>
                <input
                  type="datetime-local"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">End Time & Date</label>
                <input
                  type="datetime-local"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
