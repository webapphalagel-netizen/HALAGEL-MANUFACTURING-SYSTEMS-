
import React, { useState, useMemo, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { CATEGORIES, PROCESSES } from '../../constants';
import { ProductionEntry } from '../../types';
import { Trash2, Download, Calendar, List, Filter, XCircle, Palmtree, BarChart2, MessageSquare } from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, ComposedChart, Line, Area
} from 'recharts';

export const ProductionLog: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { refreshKey, triggerRefresh, isDarkMode } = useDashboard();
  const [data, setData] = useState<ProductionEntry[]>([]);
  const offDays = useMemo(() => StorageService.getOffDays(), []);
  
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [category, setCategory] = useState('All');
  const [processType, setProcessType] = useState('All');

  useEffect(() => {
    setData(StorageService.getProductionData());
  }, [refreshKey]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (!d) return false;
      const matchCat = category === 'All' || d.category === category;
      const matchProc = processType === 'All' || d.process === processType;
      const matchStart = !dateRange.start || (d.date && d.date >= dateRange.start);
      const matchEnd = !dateRange.end || (d.date && d.date <= dateRange.end);
      return matchCat && matchProc && matchStart && matchEnd;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [data, dateRange, category, processType]);

  const monthlyData = useMemo(() => {
    const groups: Record<string, { plan: number, actual: number, count: number }> = {};
    
    filteredData.forEach(d => {
        if (!d.date) return;
        const monthKey = d.date.substring(0, 7); 
        if (!groups[monthKey]) {
            groups[monthKey] = { plan: 0, actual: 0, count: 0 };
        }
        groups[monthKey].plan += (d.planQuantity || 0);
        groups[monthKey].actual += (d.actualQuantity || 0);
        groups[monthKey].count++;
    });

    return Object.entries(groups)
        .map(([month, stats]) => ({
            name: month,
            plan: stats.plan,
            actual: stats.actual,
            efficiency: stats.plan > 0 ? Number(((stats.actual / stats.plan) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')); 
  }, [filteredData]);

  // Data for the Daily Chart (Top 10 products by Plan)
  const chartDailyData = useMemo(() => {
    const products: Record<string, { plan: number, actual: number }> = {};
    filteredData.forEach(d => {
        const key = d.productName;
        if (!products[key]) products[key] = { plan: 0, actual: 0 };
        products[key].plan += d.planQuantity;
        products[key].actual += d.actualQuantity;
    });

    return Object.entries(products)
        .map(([name, stats]) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            fullName: name,
            plan: stats.plan,
            actual: stats.actual
        }))
        .sort((a, b) => b.plan - a.plan)
        .slice(0, 10);
  }, [filteredData]);

  // Fixed: Added async and await to handle the Promise returned by deleteProductionEntry
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this entry?")) return;
    const { deletedItem } = await StorageService.deleteProductionEntry(id);
    if (deletedItem) {
        StorageService.addLog({
          userId: user!.id,
          userName: user!.name,
          action: 'DELETE_RECORD',
          details: `Record deleted from reports: ${deletedItem.productName} (${deletedItem.date})`
        });
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: 'RECORD REMOVED SUCCESSFULLY', type: 'info' } 
        }));
    }
    triggerRefresh();
  };

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setCategory('All');
    setProcessType('All');
  };

  const calculateEfficiency = (actual: number, plan: number) => {
    if (!plan || plan === 0) return 0;
    return ((actual / plan) * 100).toFixed(1);
  };

  const downloadCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';
    const today = getTodayISO();

    if (viewMode === 'daily') {
        headers = ["Date", "Status", "Category", "Process", "Product", "Plan", "Actual", "Unit", "Efficiency %", "Batch No", "Manpower", "Remarks"];
        rows = filteredData.map(d => {
            const isOff = offDays.some(od => od.date === d.date);
            return [
                d.date, isOff ? 'Holiday Shift' : 'Normal', d.category, d.process, `"${d.productName}"`, d.planQuantity || 0, d.actualQuantity || 0, d.unit || 'KG',
                calculateEfficiency(d.actualQuantity || 0, d.planQuantity || 0), d.batchNo || '', d.manpower || '', `"${d.remark || ''}"`
            ];
        });
        filename = `production_log_daily_${today}.csv`;
    } else {
        headers = ["Month", "Total Plan", "Total Actual", "Overall Efficiency %"];
        rows = monthlyData.map(m => [ m.name, m.plan || 0, m.actual || 0, (m.efficiency || 0).toFixed(2) ]);
        filename = `production_summary_monthly_${today}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'REPORT EXPORTED SUCCESSFULLY', type: 'success' } }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Production Analytics</h2>
        
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-gray-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setViewMode('daily')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-600'}`}>
                <List className="w-4 h-4" /> Daily
            </button>
            <button onClick={() => setViewMode('monthly')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${viewMode === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-600'}`}>
                <Calendar className="w-4 h-4" /> Monthly
            </button>
        </div>

        <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> Date From
          </label>
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
            className="px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto font-bold dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> Date To
          </label>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
            className="px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto font-bold dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Department</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px] font-bold dark:text-white"
          >
            <option value="All">All Departments</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Process</label>
          <select 
            value={processType} 
            onChange={e => setProcessType(e.target.value)}
            className="px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px] font-bold dark:text-white"
          >
            <option value="All">All Processes</option>
            {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button 
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition"
        >
          <XCircle className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {viewMode === 'daily' ? 'Filtered Product Performance (Top 10)' : 'Monthly Production Efficiency'}
                </h3>
            </div>
            {viewMode === 'monthly' && (
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Actual</span>
                    </div>
                </div>
            )}
        </div>

        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={viewMode === 'daily' ? chartDailyData : monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 800, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 800, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
                    />
                    <Tooltip 
                        cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                        contentStyle={{ 
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Bar dataKey="plan" name="Target Plan" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={viewMode === 'daily' ? 30 : 50} />
                    <Bar dataKey="actual" name="Total Actual" fill="#10b981" radius={[6, 6, 0, 0]} barSize={viewMode === 'daily' ? 30 : 50} />
                    {viewMode === 'monthly' && (
                        <Line type="monotone" dataKey="efficiency" name="Eff. %" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-slate-900/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b dark:border-slate-700">
              {viewMode === 'daily' ? (
                  <tr>
                    <th className="px-8 py-5">Date / Status</th>
                    <th className="px-8 py-5 text-center">Dept</th>
                    <th className="px-8 py-5">Product Details</th>
                    <th className="px-8 py-5 text-right">Plan</th>
                    <th className="px-8 py-5 text-right">Actual</th>
                    <th className="px-8 py-5 text-center">Unit</th>
                    <th className="px-8 py-5 text-right">Eff. %</th>
                    <th className="px-8 py-5">Remarks</th>
                    {hasPermission(['admin', 'manager']) && <th className="px-8 py-5 text-center">Actions</th>}
                  </tr>
              ) : (
                  <tr>
                    <th className="px-8 py-5">Summary Month</th>
                    <th className="px-8 py-5 text-right">Total Plan</th>
                    <th className="px-8 py-5 text-right">Total Actual</th>
                    <th className="px-8 py-5 text-right">Avg Efficiency</th>
                  </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {viewMode === 'daily' ? (
                  filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">No matching records found</td>
                    </tr>
                  ) : filteredData.map(entry => {
                    const eff = Number(calculateEfficiency(entry.actualQuantity || 0, entry.planQuantity || 0));
                    const isOff = entry.date && offDays.some(od => od.date === entry.date);
                    return (
                      <tr key={entry.id} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors ${isOff ? 'bg-amber-50/10 dark:bg-amber-900/5' : ''}`}>
                        <td className="px-8 py-6">
                            <div className="font-black text-slate-800 dark:text-white mb-1 font-mono text-xs">{entry.date || 'N/A'}</div>
                            {isOff ? (
                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">
                                    <Palmtree className="w-3 h-3" /> Holiday
                                </span>
                            ) : (
                                <span className="text-[9px] font-black uppercase text-slate-300">Operational</span>
                            )}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800">
                            {entry.category}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                            <div className="font-black text-slate-800 dark:text-white">{entry.productName}</div>
                            <div className="text-[10px] font-black uppercase text-indigo-500 tracking-tight mt-0.5">{entry.process}</div>
                        </td>
                        <td className="px-8 py-6 text-right font-black font-mono text-slate-700 dark:text-slate-200">{(entry.planQuantity || 0).toLocaleString()}</td>
                        <td className="px-8 py-6 text-right font-black font-mono text-emerald-500">{(entry.actualQuantity || 0).toLocaleString()}</td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-[10px] font-black text-slate-400">{entry.unit || 'KG'}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[11px] ${
                                eff >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                eff >= 80 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                                {eff}%
                            </div>
                        </td>
                        <td className="px-8 py-6">
                            <div className="flex items-start gap-2 max-w-[150px]">
                                {entry.remark ? (
                                    <>
                                        <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-2">{entry.remark}</span>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-slate-300">-</span>
                                )}
                            </div>
                        </td>
                        {hasPermission(['admin', 'manager']) && (
                            <td className="px-8 py-6 text-center">
                                <button onClick={() => handleDelete(entry.id)} className="text-slate-300 hover:text-rose-500 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        )}
                      </tr>
                    );
                  })
              ) : (
                  monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">No summaries available</td>
                    </tr>
                  ) : monthlyData.map(m => (
                      <tr key={m.name} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition">
                          <td className="px-8 py-6 font-black text-slate-800 dark:text-white text-lg">{m.name}</td>
                          <td className="px-8 py-6 text-right font-mono font-black text-slate-700 dark:text-slate-200">{(m.plan || 0).toLocaleString()}</td>
                          <td className="px-8 py-6 text-right font-mono font-black text-emerald-500">{(m.actual || 0).toLocaleString()}</td>
                          <td className="px-8 py-6 text-right font-black">
                            <div className={`inline-flex px-4 py-2 rounded-2xl font-black text-base ${m.efficiency >= 85 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {m.efficiency.toFixed(1)}%
                            </div>
                          </td>
                      </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
