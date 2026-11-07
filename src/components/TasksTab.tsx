/**
 * Task Management Tab component
 */
import React, { useState } from 'react';
import { Workspace, Task } from '../types';
import { CheckSquare, Plus, Search, Filter, Trash2, Edit3, Calendar, Flag, Play } from 'lucide-react';

interface TasksTabProps {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
  darkMode: boolean;
  onStartTimerForTask: (task: Task) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ workspace, onUpdateWorkspace, darkMode, onStartTimerForTask }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('General');
  const [due, setDue] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setProject('General');
    setDue(new Date().toISOString().split('T')[0]);
    setPriority('Medium');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setProject(task.project);
    setDue(task.due);
    setPriority(task.priority);
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      const updated = workspace.tasks.map((t) =>
        t.id === editingTask.id ? { ...t, title, project, due, priority } : t
      );
      onUpdateWorkspace({ ...workspace, tasks: updated });
    } else {
      const newTask: Task = {
        id: 'task-' + Date.now(),
        title,
        project,
        due,
        done: false,
        priority
      };
      onUpdateWorkspace({ ...workspace, tasks: [newTask, ...workspace.tasks] });
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = workspace.tasks.filter((t) => String(t.id) !== String(id));
    onUpdateWorkspace({ ...workspace, tasks: updated });
  };

  const handleToggleDone = (id: string) => {
    const updated = workspace.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    onUpdateWorkspace({ ...workspace, tasks: updated });
  };

  // Filtered tasks
  const filteredTasks = workspace.tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' ||
                          (statusFilter === 'Done' && t.done) ||
                          (statusFilter === 'Active' && !t.done);
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const priorityColors = {
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    High: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  };

  return (
    <div className="space-y-6">
      {/* Actions & Filters Bar */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or projects..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-medium ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-900'
            }`}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-medium ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-900'
            }`}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Done">Completed</option>
          </select>

          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <h4 className="font-bold text-base mb-4">Tasks ({filteredTasks.length})</h4>
        {filteredTasks.length === 0 ? (
          <p className="text-xs text-zinc-500 py-8 text-center">No tasks found matching your criteria.</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${
                  darkMode ? 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800/80' : 'bg-[#fcfbf9] border-emerald-900/10 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggleDone(task.id)}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 sm:mt-0"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${task.done ? 'line-through text-zinc-400' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{task.project}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.due}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!task.done && (
                    <button
                      onClick={() => onStartTimerForTask(task)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Start timer for task"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Track Time
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-emerald-900/10 text-zinc-900'
          }`}>
            <h3 className="font-bold text-lg mb-4">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task description..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Project</label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Project name..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
