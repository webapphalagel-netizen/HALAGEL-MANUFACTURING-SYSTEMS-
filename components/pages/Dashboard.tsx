
import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { StorageService } from '../../services/storageService';
import { ProductionEntry, OffDay } from '../../types';
import { PROCESSES } from '../../constants';
import { 
  ClipboardList, CheckCircle, RefreshCw, List, Calendar, 
  TrendingUp, Download, Pencil, Trash2, Layers,
  Palmtree, Loader2, Beaker, Pill, Droplets, Filter as FilterIcon, Package,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate, getCurrentMonthISO } from '../../utils/dateUtils';

// Helper to get icons for each process
const getProcessIcon = (process: string) => {
  switch (process) {
    case 'Mixing': return <Beaker className="w-12 h-12" />;
    case 'Encapsulation': return <Pill className="w-12 h-12" />;
    case 'Filling': return <Droplets className="w-12 h-12" />;
    case 'Sorting': return <FilterIcon className="w-12 h-12" />;
    case 'Packing': return <Package className="w-12 h-12" />;
    default: return <Layers className="w-12 h-12" />;
  }
};

export const Dashboard: React.FC = () => {
  const { category, refreshKey, triggerRefresh } = useDashboard();
  const { user, hasPermission } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthISO());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { productionData, offDays } = useMemo(() => {
    return {
      productionData: StorageService.getProductionData(),
      offDays: StorageService.getOffDays(),
    };
  }, [refreshKey]);

  const dashboardData = useMemo(() => {
    const relevant = productionData.filter(d => d && d.category === category && d.date);
    let selectedMonthPlan = 0;
    let selectedMonthActual = 0;
    const selectedMonthProcessMap = new Map<string, {process: string, Plan: number, Actual: number}>();
    PROCESSES.forEach(proc => {
      selectedMonthProcessMap.set(proc, { process: proc, Plan: 0, Actual: 0 });
    });

    relevant.forEach(d => {
      const dateStr = (d.date || '').trim().substring(0, 7);
      if (dateStr === selectedMonth) {
        selectedMonthPlan += (d.planQuantity || 0);
        selectedMonthActual += (d.actualQuantity || 0);
        const procName = d.process || 'Other';
        if (selectedMonthProcessMap.has(procName)) {
          const p = selectedMonthProcessMap.get(procName)!;
          p.Plan += (d.planQuantity || 0);
          p.Actual += (d.actualQuantity || 0);
        }
      }
    });

    return {
      filteredData: relevant.sort((a,b) => (b.date || '').localeCompare(a.date || '')),
      selectedMonthStats: { 
        plan: selectedMonthPlan, 
        actual: selectedMonthActual,
        efficiency: selectedMonthPlan > 0 ? (selectedMonthActual / selectedMonthPlan) * 100 : 0
      },
      chartData: Array.from(selectedMonthProcessMap.values())
    };
  }, [productionData, category, selectedMonth]);

  const dailyGroups = useMemo(() => {
    const baseData = dashboardData.filteredData;
    const filteredEntries = baseData.filter(d => d && d.date && d.date.trim().startsWith(selectedMonth));
    const filteredOffDays = offDays.filter(od => od && od.date && od.date.trim().startsWith(selectedMonth));
    const dates = new Set<string>();
    filteredEntries.forEach(d => { if (d.date) dates.add(d.date.trim().substring(0, 10)); });
    filteredOffDays.forEach(od => { if (od.date) dates.add(od.date.trim().substring(0, 10)); });
    const sortedDates = Array.from(dates).sort((a, b) => (b || '').localeCompare(a || ''));

    return sortedDates.map(dateKey => {
        const entriesForDate = filteredEntries.filter(d => d.date && d.date.trim().substring(0, 10) === dateKey);
        const offDayInfo = filteredOffDays.find(od => od.date && od.date.trim().substring(0, 10) === dateKey);
        const totalActualForDate = entriesForDate.reduce((sum, entry) => sum + (entry.actualQuantity || 0), 0);
        return {
            date: dateKey,
            totalActualForDate,
            entries: entriesForDate,
            isOffDay: !!offDayInfo,
            offDayName: offDayInfo?.description || ''
        };
    });
  }, [dashboardData.filteredData, offDays, selectedMonth]);

  const handleDelete = async (id: string) => {
      if(!window.confirm("Are you sure? This will PERMANENTLY remove the record from both local and cloud databases.")) return;
      
      setIsDeleting(id);
      try {
        const { deletedItem } = await StorageService.deleteProductionEntry(id);
        if (deletedItem) {
            StorageService.addLog({
              userId: user!.id,
              userName: user!.name,
              action: 'DELETE_RECORD',
              details: `Permanently removed production record: ${deletedItem.productName} (${deletedItem.date}) from cloud.`
            });
            window.dispatchEvent(new CustomEvent('app-notification', { 
              detail: { message: 'CLOUD DATA PURGED SUCCESSFULLY', type: 'success' } 
            }));
        }
        triggerRefresh();
      } catch (err) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'CLOUD SYNC ERROR - CHECK INTERNET', type: 'info' } 
        }));
      } finally {
        setIsDeleting(null);
      }
  };

  const handleEdit = (entry: ProductionEntry) => {
    window.dispatchEvent(new CustomEvent('edit-production-entry', { detail: entry }));
  };

  const downloadCSV = () => {
    const headers = ["Date", "Status", "Process", "Product", "Plan", "Actual", "Unit", "Batch No", "Manpower", "Remark"];
    const rows = dailyGroups.flatMap(g => {
        if (g.entries.length === 0) return [[g.date, g.offDayName || 'Off Day', '-', '-', 0, 0, '-', '-', 0, '-']];
        return g.entries.map(d => [d.date, g.isOffDay ? `Holiday (${g.offDayName})` : 'Normal', d.process, d.productName, d.planQuantity, d.actualQuantity, d.unit || 'KG', d.batchNo, d.manpower, d.remark || '']);
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Halagel_Full_Report_${category}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    StorageService.addLog({ userId: user!.id, userName: user!.name, action: 'EXPORT_REPORT', details: `Exported report for ${category} (${selectedMonth})` });
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'REPORT EXPORTED', type: 'success' } }));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-blue-500 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-16 h-16" /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Plan (Total)</p>
            <h3 className="text-3xl font-black mt-1 text-slate-800 dark:text-white font-mono">{(dashboardData.selectedMonthStats.plan || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-emerald-500 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><CheckCircle className="w-16 h-16" /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Actual (Total)</p>
            <h3 className="text-3xl font-black mt-1 text-slate-800 dark:text-white font-mono">{(dashboardData.selectedMonthStats.actual || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-indigo-500 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><RefreshCw className="w-16 h-16" /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Efficiency</p>
            <h3 className="text-3xl font-black mt-1 text-slate-800 dark:text-white font-mono">{(dashboardData.selectedMonthStats.efficiency || 0).toFixed(1)}%</h3>
        </div>
      </div>

      {/* PROCESS BREAKDOWN SECTION - REDESIGNED */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Process Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {dashboardData.chartData.map((item) => {
                const eff = item.Plan > 0 ? (item.Actual / item.Plan) * 100 : 0;
                return (
                    <div key={item.process} className="glass-panel p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-lg group hover:border-indigo-500/40 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                        {/* Background Decoration Icon */}
                        <div className="absolute -right-4 -bottom-4 text-indigo-500/5 dark:text-indigo-400/5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                          {getProcessIcon(item.process)}
                        </div>

                        <div className="relative z-10">
                          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em] mb-8 pb-3 border-b border-indigo-50 dark:border-indigo-900/30">
                            {item.process}
                          </p>
                          
                          <div className="space-y-6">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">
                                  {(item.Plan || 0).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actual</span>
                                <span className="text-2xl font-black text-emerald-500 font-mono leading-none">
                                  {(item.Actual || 0).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="pt-4 border-t border-gray-50 dark:border-slate-700/50 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eff.</span>
                                <span className={`text-xl font-black font-mono leading-none ${eff >= 100 ? 'text-emerald-500' : eff >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {(eff || 0).toFixed(1)}%
                                </span>
                              </div>
                          </div>
                          
                          {/* Mini Progress Bar */}
                          <div className="mt-6 w-full h-1.5 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${eff >= 100 ? 'bg-emerald-500' : eff >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${Math.min(eff, 100)}%` }}
                            />
                          </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><List className="w-5 h-5 text-indigo-500" />Daily Production Log</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Granularity for {selectedMonth}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 dark:text-white outline-none" />
              <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-lg uppercase tracking-widest transition"><Download className="w-4 h-4" /> Export Report</button>
            </div>
        </div>
        <div className="space-y-6">
            {dailyGroups.length === 0 ? (
                <div className="glass-panel p-16 rounded-[2rem] text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-200"><ClipboardList className="w-12 h-12" /></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest">No logs found for this period.</p>
                    </div>
                </div>
            ) : dailyGroups.map((group, groupIdx) => {
                const displayDate = formatDisplayDate(group.date);
                const [datePart, dayPart] = displayDate.split(' ');
                return (
                  <div key={`group-${groupIdx}`} className={`bg-white dark:bg-slate-850 rounded-[2rem] overflow-hidden shadow-sm border ${group.isOffDay ? 'border-amber-400/50' : 'border-gray-100 dark:border-slate-800'}`}>
                      <div className={`p-8 flex justify-between items-center border-b ${group.isOffDay ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50'}`}>
                          <div className="flex items-center gap-4">
                              {group.isOffDay ? <Palmtree className="w-8 h-8 text-amber-500" /> : <Calendar className="w-8 h-8 text-slate-400" />}
                              <div className="flex items-center gap-4"><span className={`text-2xl font-black ${group.isOffDay ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{datePart}</span><span className={`text-2xl font-medium uppercase tracking-tight ${group.isOffDay ? 'text-amber-800' : 'text-slate-800 dark:text-slate-200'}`}>{dayPart}</span></div>
                              {group.isOffDay && <span className="px-4 py-1.5 bg-amber-500 text-white text-xs font-black uppercase rounded-full tracking-widest">{group.offDayName || 'OFF DAY'}</span>}
                          </div>
                          <div className="px-6 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest shadow-sm">Actual: <span className="text-emerald-500 ml-2 font-mono text-base">{(group.totalActualForDate || 0).toLocaleString()}</span></div>
                      </div>
                      {group.entries.length > 0 ? (
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-gray-50/30 dark:bg-slate-900/30">
                                        <th className="px-8 py-6">Process</th>
                                        <th className="px-8 py-6">Product</th>
                                        <th className="px-8 py-6 text-right">Plan Qty</th>
                                        <th className="px-8 py-6 text-right">Actual Qty</th>
                                        <th className="px-8 py-6 text-center">Efficiency</th>
                                        <th className="px-8 py-6 text-center">Batch No</th>
                                        <th className="px-8 py-6 text-center">Manpower</th>
                                        <th className="px-8 py-6">Remark</th>
                                        {hasPermission(['admin', 'manager']) && <th className="px-8 py-6 text-center">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/30">
                                    {group.entries.map(entry => {
                                        const eff = entry.planQuantity > 0 ? (entry.actualQuantity / entry.planQuantity) * 100 : 0;
                                        return (
                                            <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-8 py-8"><span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">{entry.process}</span></td>
                                                <td className="px-8 py-8"><span className="text-lg font-black text-slate-800 dark:text-white">{entry.productName}</span></td>
                                                <td className="px-8 py-8 text-right font-black font-mono text-indigo-600/80 dark:text-indigo-400/80 text-lg">{(entry.planQuantity || 0).toLocaleString()} <span className="text-[10px] ml-1 opacity-60 font-sans">{entry.unit}</span></td>
                                                <td className="px-8 py-8 text-right font-black font-mono text-emerald-500 text-lg">{(entry.actualQuantity || 0).toLocaleString()} <span className="text-[10px] ml-1 opacity-60 font-sans">{entry.unit}</span></td>
                                                <td className="px-8 py-8 text-center"><span className={`text-lg font-black font-mono ${eff >= 100 ? 'text-emerald-500' : eff >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>{(eff || 0).toFixed(0)}%</span></td>
                                                <td className="px-8 py-8 text-center"><span className="text-[13px] font-bold text-slate-400 uppercase tracking-tighter font-mono">{entry.batchNo || '-'}</span></td>
                                                <td className="px-8 py-8 text-center"><span className="text-xl font-black text-slate-800 dark:text-white font-mono">{entry.manpower || '0'}</span></td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-2 min-w-[150px] max-w-[250px]">
                                                        {entry.remark ? (
                                                            <div className="flex items-start gap-2">
                                                                <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 italic font-medium leading-tight">{entry.remark}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 italic font-medium">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {hasPermission(['admin', 'manager']) && (
                                                  <td className="px-8 py-8">
                                                      <div className="flex items-center justify-center gap-2">
                                                          <button onClick={() => handleEdit(entry)} className="p-2 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition"><Pencil className="w-5 h-5" /></button>
                                                          <button 
                                                              onClick={() => handleDelete(entry.id)} 
                                                              disabled={isDeleting === entry.id}
                                                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition disabled:opacity-50"
                                                          >
                                                              {isDeleting === entry.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                                          </button>
                                                      </div>
                                                  </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                      ) : (
                        <div className="p-16 text-center text-slate-400 text-sm italic font-bold uppercase tracking-widest">No activity recorded for this date.</div>
                      )}
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
