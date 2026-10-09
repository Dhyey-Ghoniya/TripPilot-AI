import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  X,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Receipt,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  DollarSign,
  BarChart3,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingBag,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import budgetService from '../../services/budgetService';

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────
const CATEGORIES = ['Flights', 'Hotels', 'Food', 'Activities', 'Transport', 'Shopping', 'Miscellaneous'];

const CATEGORY_CONFIG = {
  Flights: { color: '#0ea5e9', bg: 'bg-sky-500', bgLight: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', icon: '✈️' },
  Hotels: { color: '#f59e0b', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: '🏨' },
  Food: { color: '#f43f5e', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '🍽️' },
  Activities: { color: '#10b981', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: '🎯' },
  Transport: { color: '#6366f1', bg: 'bg-indigo-500', bgLight: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: '🚕' },
  Shopping: { color: '#a855f7', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: '🛍️' },
  Miscellaneous: { color: '#64748b', bg: 'bg-slate-500', bgLight: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', icon: '📦' },
};

const COST_TYPES = [
  { value: 'actual', label: 'Actual', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { value: 'estimated', label: 'Estimated', color: 'text-amber-600', bg: 'bg-amber-500/10' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const formatCurrency = (amount, currency = 'INR') => {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  return `${symbol}${(amount || 0).toLocaleString('en-IN')}`;
};

// ────────────────────────────────────────────────────────────────────
// Donut Chart (SVG)
// ────────────────────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 180, strokeWidth = 22 }) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      {/* Background track */}
      <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-slate-800" />
      {/* Segments */}
      {segments.map((seg, i) => {
        const dashLength = (seg.pct / 100) * circumference;
        const dashOffset = -cumulativeOffset;
        cumulativeOffset += dashLength;
        return (
          <circle
            key={i} cx={center} cy={center} r={radius}
            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-700 ease-out"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        );
      })}
      {/* Center text */}
      <text x={center} y={center - 8} textAnchor="middle" className="fill-slate-800 dark:fill-white text-lg font-black">
        {Math.round(segments.reduce((s, seg) => s + seg.pct, 0))}%
      </text>
      <text x={center} y={center + 12} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-semibold">
        ALLOCATED
      </text>
    </svg>
  );
};

// ────────────────────────────────────────────────────────────────────
// Add Expense Modal
// ────────────────────────────────────────────────────────────────────
const AddExpenseForm = ({ tripId, onSave, onCancel, editingExpense = null }) => {
  const [form, setForm] = useState({
    title: editingExpense?.title || '',
    amount: editingExpense?.amount || '',
    category: editingExpense?.category || 'Miscellaneous',
    costType: editingExpense?.costType || 'actual',
    date: editingExpense?.date ? new Date(editingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: editingExpense?.paymentMethod || 'cash',
    paidBy: editingExpense?.paidBy || 'Self',
    notes: editingExpense?.notes || '',
    description: editingExpense?.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    try {
      if (editingExpense) {
        await budgetService.updateExpense(editingExpense._id, { ...form, amount: parseFloat(form.amount) });
      } else {
        await budgetService.createExpense(tripId, { ...form, amount: parseFloat(form.amount) });
      }
      onSave();
    } catch (err) {
      console.error('Expense save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            {editingExpense ? 'Edit Expense' : 'Add Expense'}
          </h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
            <input
              type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Lunch at Marina Bay"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">₹</span>
                <input
                  type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0" min="0" step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Date</label>
              <input
                type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat} type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                    form.category === cat
                      ? `${CATEGORY_CONFIG[cat].bgLight} border-current ${CATEGORY_CONFIG[cat].text} ring-1 ring-current/20`
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-base block mb-0.5">{CATEGORY_CONFIG[cat].icon}</span>
                  <span className="text-[10px]">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Cost Type</label>
            <div className="flex gap-2">
              {COST_TYPES.map((ct) => (
                <button
                  key={ct.value} type="button"
                  onClick={() => setForm({ ...form, costType: ct.value })}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    form.costType === ct.value
                      ? `${ct.bg} ${ct.color} border-current ring-1 ring-current/20`
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value} type="button"
                  onClick={() => setForm({ ...form, paymentMethod: pm.value })}
                  className={`flex-1 py-2 px-2 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    form.paymentMethod === pm.value
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <pm.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paid By + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Paid By</label>
              <input
                type="text" value={form.paidBy} onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Notes</label>
              <input
                type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={saving || !form.title.trim() || !form.amount}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
          >
            {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Main BudgetView Component
// ────────────────────────────────────────────────────────────────────
const BudgetView = ({ trip, itinerary }) => {
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard'); // dashboard | expenses | ai
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [costTypeFilter, setCostTypeFilter] = useState('all');
  const [expandedAlerts, setExpandedAlerts] = useState(true);

  // AI Copilot state
  const [aiCommand, setAiCommand] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const tripId = trip?._id;

  const loadDashboard = useCallback(async () => {
    if (!tripId) return;
    setIsLoading(true);
    try {
      const res = await budgetService.getDashboard(tripId);
      setDashboard(res?.data || res);
    } catch (err) {
      console.error('Dashboard load error:', err);
      // Fallback to local calculation
      setDashboard(buildLocalDashboard(trip, itinerary));
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  const loadExpenses = useCallback(async () => {
    if (!tripId) return;
    try {
      const filters = {};
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (costTypeFilter !== 'all') filters.costType = costTypeFilter;
      const res = await budgetService.getExpenses(tripId, filters);
      setExpenses(res?.data || res || []);
    } catch (err) {
      console.error('Expenses load error:', err);
      setExpenses([]);
    }
  }, [tripId, categoryFilter, costTypeFilter]);

  useEffect(() => {
    loadDashboard();
    loadExpenses();
  }, [loadDashboard, loadExpenses]);

  const handleExpenseSaved = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
    loadDashboard();
    loadExpenses();
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await budgetService.deleteExpense(expenseId);
      loadDashboard();
      loadExpenses();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAiCommand = async () => {
    if (!aiCommand.trim() || !tripId) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await budgetService.aiOptimize(tripId, aiCommand.trim());
      setAiResult(res?.data || res);
      setAiCommand('');
      loadDashboard();
    } catch (err) {
      console.error('AI optimize error:', err);
      setAiResult({ success: false, message: 'Could not process budget command.' });
    } finally {
      setAiLoading(false);
    }
  };

  // ── Fallback local dashboard builder ──
  const buildLocalDashboard = (trip, itinerary) => {
    const totalBudget = trip?.budget?.total || 50000;
    const breakdown = trip?.budget?.breakdown || {};
    const durationDays = trip?.dates?.durationDays || 5;

    const categoryData = {};
    CATEGORIES.forEach((cat) => {
      let est = 0;
      if (cat === 'Flights') est = breakdown.flights || Math.round(totalBudget * 0.3);
      else if (cat === 'Hotels') est = breakdown.hotel || Math.round(totalBudget * 0.28);
      else if (cat === 'Food') est = breakdown.food || Math.round(totalBudget * 0.15);
      else if (cat === 'Activities') est = itinerary?.totalEstimatedCost || breakdown.activities || Math.round(totalBudget * 0.12);
      else if (cat === 'Transport') est = breakdown.transit || Math.round(totalBudget * 0.08);
      else if (cat === 'Shopping') est = breakdown.shopping || Math.round(totalBudget * 0.05);
      else est = breakdown.misc || Math.round(totalBudget * 0.02);

      categoryData[cat] = { estimated: est, confirmed: 0, actual: 0, icon: CATEGORY_CONFIG[cat].icon };
    });

    const totalEstimated = Object.values(categoryData).reduce((s, c) => s + c.estimated, 0);

    return {
      currency: trip?.budget?.currency || 'INR',
      totalBudget,
      durationDays,
      summary: {
        totalEstimated,
        totalConfirmed: 0,
        totalActual: 0,
        totalSpent: 0,
        remainingBudget: totalBudget,
        overBudgetAmount: 0,
        averageDailyCost: Math.round(totalEstimated / durationDays),
        budgetUtilization: 0,
        isOverBudget: false,
      },
      breakdown: categoryData,
      dailyCosts: (itinerary?.days || []).map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        theme: d.theme,
        estimatedCost: d.estimatedDayCost || 0,
        activityCount: (d.activities || []).length,
      })),
      alerts: [],
      expenseCount: 0,
    };
  };

  const data = dashboard || buildLocalDashboard(trip, itinerary);
  const currency = data.currency || 'INR';

  // Donut segments
  const donutSegments = useMemo(() => {
    if (!data.breakdown) return [];
    return CATEGORIES.map((cat) => {
      const catData = data.breakdown[cat] || {};
      const total = (catData.estimated || 0) + (catData.confirmed || 0) + (catData.actual || 0);
      return {
        label: cat,
        pct: data.totalBudget > 0 ? Math.max(0, (total / data.totalBudget) * 100) : 0,
        color: CATEGORY_CONFIG[cat].color,
      };
    }).filter((s) => s.pct > 0);
  }, [data]);

  // ── Section tabs ──
  const sectionTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'ai', label: 'AI Copilot', icon: Sparkles },
  ];

  if (isLoading) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center space-y-3 border border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Loading Budget Intelligence...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSection === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD SECTION                                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budget */}
            <Card className="p-5 border border-slate-200 dark:border-slate-800 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3" /> Total Budget
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(data.totalBudget, currency)}</h3>
              <span className="text-[10px] text-slate-400">{data.durationDays} days · {trip?.travelers?.count || 1} travelers</span>
            </Card>

            {/* Estimated */}
            <Card className="p-5 border border-amber-200/60 dark:border-amber-800/30 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Estimated
              </span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(data.summary.totalEstimated, currency)}</h3>
              <span className="text-[10px] text-slate-400">AI-projected costs</span>
            </Card>

            {/* Actually Spent */}
            <Card className="p-5 border border-emerald-200/60 dark:border-emerald-800/30 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Spent
              </span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.totalSpent, currency)}</h3>
              <span className="text-[10px] text-slate-400">Confirmed + Actual</span>
            </Card>

            {/* Remaining */}
            <Card className={`p-5 border space-y-1.5 relative overflow-hidden ${
              data.summary.isOverBudget
                ? 'border-red-200/60 dark:border-red-800/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl rounded-bl-full ${
                data.summary.isOverBudget ? 'from-red-500/10' : 'from-slate-500/5'
              } to-transparent`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                data.summary.isOverBudget ? 'text-red-500' : 'text-slate-400'
              }`}>
                {data.summary.isOverBudget ? <AlertTriangle className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                {data.summary.isOverBudget ? 'Over Budget' : 'Remaining'}
              </span>
              <h3 className={`text-2xl font-black ${
                data.summary.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
              }`}>
                {data.summary.isOverBudget
                  ? `-${formatCurrency(data.summary.overBudgetAmount, currency)}`
                  : formatCurrency(data.summary.remainingBudget, currency)}
              </h3>
              <span className="text-[10px] text-slate-400">
                {formatCurrency(data.summary.averageDailyCost, currency)} / day avg
              </span>
            </Card>
          </div>

          {/* Budget Utilization + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart Card */}
            <Card className="lg:col-span-4 p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5" /> Category Distribution
              </h4>
              <DonutChart segments={donutSegments} />
              <div className="flex flex-wrap justify-center gap-2">
                {donutSegments.map((seg) => (
                  <span key={seg.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.label}
                  </span>
                ))}
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card className="lg:col-span-8 p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Category Breakdown
              </h4>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const catData = data.breakdown?.[cat] || {};
                  const est = catData.estimated || 0;
                  const conf = catData.confirmed || 0;
                  const act = catData.actual || 0;
                  const catTotal = est + conf + act;
                  const pct = data.totalBudget > 0 ? Math.min(100, (catTotal / data.totalBudget) * 100) : 0;

                  return (
                    <div key={cat} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{CATEGORY_CONFIG[cat].icon}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          {est > 0 && <span className="text-amber-500 font-semibold">Est: {formatCurrency(est, currency)}</span>}
                          {conf > 0 && <span className="text-blue-500 font-semibold">Conf: {formatCurrency(conf, currency)}</span>}
                          {act > 0 && <span className="text-emerald-500 font-semibold">Act: {formatCurrency(act, currency)}</span>}
                          <span className="font-black text-slate-900 dark:text-white text-xs">{formatCurrency(catTotal, currency)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_CONFIG[cat].bg} transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Budget Alerts */}
          {data.alerts && data.alerts.length > 0 && (
            <Card className="p-5 border border-amber-200/60 dark:border-amber-800/30 space-y-3">
              <button
                onClick={() => setExpandedAlerts(!expandedAlerts)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Budget Alerts ({data.alerts.length})
                </h4>
                {expandedAlerts ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedAlerts && (
                <div className="space-y-2">
                  {data.alerts.map((alert, i) => (
                    <div key={i} className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                      alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    }`}>
                      <span className="text-base flex-shrink-0">{alert.icon}</span>
                      <div>
                        <span className="font-bold block">{alert.title}</span>
                        <span className="opacity-80">{alert.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Daily Cost Breakdown */}
          {data.dailyCosts && data.dailyCosts.length > 0 && (
            <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Daily Spending Projection
              </h4>
              <div className="space-y-2">
                {data.dailyCosts.map((day) => {
                  const pct = data.totalBudget > 0 ? Math.min(100, (day.estimatedCost / (data.totalBudget / data.durationDays)) * 100) : 0;
                  return (
                    <div key={day.dayNumber} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white w-12">Day {day.dayNumber}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{day.theme}</span>
                          <Badge variant="muted" size="xs">{day.activityCount} activities</Badge>
                        </div>
                        <span className={`text-xs font-bold ${
                          pct > 120 ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>{formatCurrency(day.estimatedCost, currency)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct > 120 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* EXPENSES SECTION                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeSection === 'expenses' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].icon} {cat}</option>
                ))}
              </select>

              {/* Cost Type Filter */}
              <select
                value={costTypeFilter}
                onChange={(e) => setCostTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="estimated">Estimated</option>
                <option value="confirmed">Confirmed</option>
                <option value="actual">Actual</option>
              </select>

              <Badge variant="muted" size="sm">{expenses.length} expenses</Badge>
            </div>

            <button
              onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <Card className="p-12 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <span className="text-sm font-semibold text-slate-400">No expenses recorded yet.</span>
              <span className="text-xs text-slate-400">Add actual expenses during or after your trip.</span>
              <button
                onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition"
              >
                Add First Expense
              </button>
            </Card>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => {
                const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.Miscellaneous;
                const costTypeConfig = COST_TYPES.find((ct) => ct.value === exp.costType) || COST_TYPES[0];
                return (
                  <Card key={exp._id} className="p-4 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${catConfig.bgLight} flex items-center justify-center text-lg flex-shrink-0`}>
                          {catConfig.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{exp.title}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${costTypeConfig.bg} ${costTypeConfig.color}`}>
                              {costTypeConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{exp.category}</span>
                            <span>·</span>
                            <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            {exp.paidBy && exp.paidBy !== 'Self' && (
                              <>
                                <span>·</span>
                                <span>Paid by {exp.paidBy}</span>
                              </>
                            )}
                            {exp.notes && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[150px]">{exp.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(exp.amount, exp.currency)}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => { setEditingExpense(exp); setShowAddExpense(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AI BUDGET COPILOT SECTION                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeSection === 'ai' && (
        <div className="space-y-5 max-w-2xl mx-auto">
          <Card className="p-6 border border-purple-200/60 dark:border-purple-800/30 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Budget Copilot
              </h3>
              <p className="text-xs text-slate-400">Ask the AI to optimize your budget, find savings, or analyze spending.</p>
            </div>

            {/* Quick Commands */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'Keep the trip under ₹80,000',
                'Make Day 3 cheaper',
                'Find cheaper activities',
                'Suggest a cheaper hotel',
                'Where am I overspending?',
                'Optimize budget',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setAiCommand(cmd)}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition border border-purple-200/40 dark:border-purple-700/40"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Command Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                placeholder="e.g., Keep the trip under ₹60,000..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
              <button
                onClick={handleAiCommand}
                disabled={aiLoading || !aiCommand.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-sm hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* AI Result */}
            {aiResult && (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className={`p-4 rounded-xl ${aiResult.success !== false ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className={`text-sm font-semibold ${aiResult.success !== false ? 'text-purple-700 dark:text-purple-300' : 'text-red-700 dark:text-red-300'}`}>
                    {aiResult.message}
                  </p>
                </div>

                {/* Savings recommendations */}
                {aiResult.data?.savings && aiResult.data.savings.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Potential Savings</h5>
                    {aiResult.data.savings.map((saving, i) => (
                      <div key={i} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-xs flex items-start gap-2">
                        <ArrowDownRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 block">{saving.suggestion}</span>
                          <span className="text-emerald-600/70 dark:text-emerald-400/70">
                            Save {formatCurrency(saving.suggestedSavings || saving.savings, currency)} on {saving.item || saving.activity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alternatives */}
                {aiResult.data?.alternatives && aiResult.data.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Cheaper Alternatives</h5>
                    {aiResult.data.alternatives.map((alt, i) => (
                      <div key={i} className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-700 dark:text-blue-300">Day {alt.dayNumber}: {alt.currentActivity}</span>
                          <Badge variant="accent" size="xs">-{formatCurrency(alt.potentialSavings, currency)}</Badge>
                        </div>
                        <span className="text-blue-600/70 dark:text-blue-400/70">→ {alt.suggestedAlternative} ({formatCurrency(alt.alternativeCost, currency)})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {aiResult.data?.recommendations && aiResult.data.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Recommendations</h5>
                    {aiResult.data.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-xs flex items-start gap-2">
                        <Zap className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 block">
                            {rec.icon} {rec.category}: {rec.suggestion || rec.title}
                          </span>
                          {rec.description && <span className="text-indigo-600/70 dark:text-indigo-400/70">{rec.description}</span>}
                          {rec.potentialSavings > 0 && (
                            <span className="block font-bold text-emerald-500 mt-0.5">Potential savings: {formatCurrency(rec.potentialSavings, currency)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overspending Analysis */}
                {aiResult.data?.analysis && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Spending Analysis</h5>
                    {aiResult.data.analysis.map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                        item.isOverspent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-800/40'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{item.category}</span>
                          <span className="text-[10px] text-slate-400">{item.status}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(item.spent, currency)}</span>
                          <span className="text-[10px] text-slate-400">of {formatCurrency(item.allocated, currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hotel Suggestions */}
                {aiResult.data?.suggestions && aiResult.data.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Hotel Alternatives</h5>
                    {aiResult.data.suggestions.map((sug, i) => (
                      <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-700 dark:text-amber-300 capitalize">{sug.type}</span>
                          <Badge variant="accent" size="xs">Save {sug.savingsPercent}%</Badge>
                        </div>
                        <span className="text-amber-600/70 dark:text-amber-400/70 block">{sug.description}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {formatCurrency(sug.estimatedCostPerNight, currency)}/night · {formatCurrency(sug.totalEstimated, currency)} total
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {aiResult.data?.totalPotentialSavings > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center">
                    <span className="text-xs font-semibold opacity-90 block">Total Potential Savings</span>
                    <span className="text-2xl font-black">{formatCurrency(aiResult.data.totalPotentialSavings, currency)}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showAddExpense && (
        <AddExpenseForm
          tripId={tripId}
          onSave={handleExpenseSaved}
          onCancel={() => { setShowAddExpense(false); setEditingExpense(null); }}
          editingExpense={editingExpense}
        />
      )}
    </div>
  );
};

export default BudgetView;
