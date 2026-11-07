/**
 * Money Management Tab component
 */
import React, { useState } from 'react';
import { Workspace, MoneyRecord } from '../types';
import { formatINR, parseRupeesToCents, centsToRupeesString } from '../utils/money';
import { Wallet, Plus, TrendingUp, TrendingDown, Trash2, Edit3, Search, Calendar, Tag } from 'lucide-react';

interface MoneyTabProps {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
  darkMode: boolean;
}

export const MoneyTab: React.FC<MoneyTabProps> = ({ workspace, onUpdateWorkspace, darkMode }) => {
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MoneyRecord | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = isIncome ? workspace.incomeCategories : workspace.expenseCategories;

  const handleOpenAddModal = (incomeDefault: boolean) => {
    setEditingRecord(null);
    setTitle('');
    setAmountRupees('');
    setIsIncome(incomeDefault);
    setCategory(incomeDefault ? workspace.incomeCategories[0] || 'Salary' : workspace.expenseCategories[0] || 'Food & Dining');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: MoneyRecord) => {
    setEditingRecord(record);
    setTitle(record.title);
    setAmountRupees(centsToRupeesString(record.cents));
    setIsIncome(record.income);
    setCategory(record.category);
    setDate(record.date);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amountRupees) return;

    const cents = parseRupeesToCents(amountRupees);
    if (cents <= 0) return;

    // Auto-save category if typed and new
    let incCats = [...workspace.incomeCategories];
    let expCats = [...workspace.expenseCategories];
    const trimmedCat = category.trim();

    if (trimmedCat) {
      if (isIncome && !incCats.includes(trimmedCat)) {
        incCats.push(trimmedCat);
      } else if (!isIncome && !expCats.includes(trimmedCat)) {
        expCats.push(trimmedCat);
      }
    }

    let updatedMoney = [...workspace.money];
    if (editingRecord) {
      updatedMoney = updatedMoney.map((m) =>
        m.id === editingRecord.id
          ? { ...m, title, category: trimmedCat || (isIncome ? 'Other Income' : 'Other Expense'), cents, income: isIncome, date }
          : m
      );
    } else {
      const newRecord: MoneyRecord = {
        id: 'money-' + Date.now(),
        title,
        category: trimmedCat || (isIncome ? 'Other Income' : 'Other Expense'),
        cents,
        income: isIncome,
        date
      };
      updatedMoney = [newRecord, ...updatedMoney];
    }

    onUpdateWorkspace({
      ...workspace,
      money: updatedMoney,
      incomeCategories: incCats,
      expenseCategories: expCats
    });
    setIsModalOpen(false);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = workspace.money.filter((m) => String(m.id) !== String(id));
    onUpdateWorkspace({ ...workspace, money: updated });
    setToastMessage('Transaction deleted successfully');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Monthly summary
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthTransactions = workspace.money.filter((m) => m.date.startsWith(currentMonthPrefix));
  const monthlyIncome = monthTransactions.filter((m) => m.income).reduce((acc, m) => acc + m.cents, 0);
  const monthlyExpense = monthTransactions.filter((m) => !m.income).reduce((acc, m) => acc + m.cents, 0);
  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Filtered transactions
  const filteredTransactions = workspace.money.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' ||
                        (filterType === 'Income' && m.income) ||
                        (filterType === 'Expense' && !m.income);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-4 rounded-2xl border flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Monthly Income</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 truncate">{formatINR(monthlyIncome)}</div>
        </div>

        <div className={`p-5 rounded-3xl border ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Monthly Expenses</span>
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-600 truncate">{formatINR(monthlyExpense)}</div>
        </div>

        <div className={`p-5 rounded-3xl border ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Net Balance</span>
            <Wallet className="w-5 h-5 text-amber-600" />
          </div>
          <div className={`text-2xl font-bold tracking-tight truncate ${monthlyBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatINR(monthlyBalance)}
          </div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions or categories..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fcfbf9] border-zinc-200 text-zinc-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl p-1 border bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
            {(['All', 'Income', 'Expense'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === type
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleOpenAddModal(false)}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>

          <button
            onClick={() => handleOpenAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-900/10 shadow-sm'
      }`}>
        <h4 className="font-bold text-base mb-4">Transactions ({filteredTransactions.length})</h4>
        {filteredTransactions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-8 text-center">No transactions found matching your criteria.</p>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  darkMode ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-[#fcfbf9] border-emerald-900/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.income
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  }`}>
                    {tx.income ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span className="px-2 py-0.5 rounded-md font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-bold text-base ${tx.income ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.income ? '+' : '-'}{formatINR(tx.cents)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(tx)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRecord(tx.id, e)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-emerald-900/10 text-zinc-900'
          }`}>
            <h3 className="font-bold text-lg mb-4">
              {editingRecord ? 'Edit Transaction' : isModalOpen && isIncome ? 'Add Income' : 'Add Expense'}
            </h3>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Title / Description</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Salary, Grocery..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Category (Select or Type New)</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Select or type category..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
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
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${
                    isIncome ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
