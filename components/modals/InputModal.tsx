
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { StorageService } from '../../services/storageService';
import { CATEGORIES, PROCESSES, UNITS } from '../../constants';
import { ProductionEntry, Category, ProcessType, UnitType } from '../../types';
import { X, Loader2, AlertTriangle, Palmtree, ShieldCheck } from 'lucide-react';
import { getTodayISO, getDbTimestamp } from '../../utils/dateUtils';

interface InputModalProps {
  onClose: () => void;
  editEntry?: ProductionEntry | null;
}

export const InputModal: React.FC<InputModalProps> = ({ onClose, editEntry }) => {
  const { user, hasPermission } = useAuth();
  const { triggerRefresh } = useDashboard();
  const [tab, setTab] = useState<'Plan' | 'Actual'>('Plan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [date, setDate] = useState(getTodayISO());
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [process, setProcess] = useState<ProcessType>(PROCESSES[0]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<UnitType>('KG');
  const [manpower, setManpower] = useState('0');
  const [batchNo, setBatchNo] = useState('');
  const [remark, setRemark] = useState('');
  
  const [plans, setPlans] = useState<ProductionEntry[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const offDays = useMemo(() => StorageService.getOffDays(), []);
  
  const currentOffDay = useMemo(() => {
    const cleanInputDate = (date || '').trim().split(' ')[0];
    return offDays.find(od => (od.date || '').trim().split(' ')[0] === cleanInputDate);
  }, [date, offDays]);

  const inputClasses = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm";

  useEffect(() => {
    if (editEntry) {
      setDate((editEntry.date || '').trim().split(' ')[0]);
      setCategory(editEntry.category);
      setProcess(editEntry.process);
      setProductName(editEntry.productName.toUpperCase());
      setUnit(editEntry.unit || 'KG');
      const isActualMode = editEntry.actualQuantity > 0;
      setQuantity(isActualMode ? (editEntry.actualQuantity || 0).toString() : (editEntry.planQuantity || 0).toString());
      setManpower(editEntry.manpower?.toString() || '0');
      setBatchNo((editEntry.batchNo || '').toUpperCase());
      setRemark((editEntry.remark || '').toUpperCase());
      setTab(isActualMode ? 'Actual' : 'Plan'); 
    } else {
      if (user?.role === 'operator') {
          setTab('Actual');
          if (user.category) setCategory(user.category);
      } else if (user?.role === 'planner') {
          setTab('Plan');
          if (user.category) setCategory(user.category);
      }
    }
  }, [editEntry, user]);

  useEffect(() => {
    if (tab === 'Actual' && !editEntry) {
        const all = StorageService.getProductionData();
        const normalizedInputDate = (date || '').trim().split(' ')[0];
        
        let relevant = all.filter(p => (p.date || '').trim().split(' ')[0] === normalizedInputDate);
        
        // DEPARTMENT FILTERING FOR OPERATORS
        if (user?.role === 'operator' && user?.category) {
            relevant = relevant.filter(p => p.category === user.category);
        }

        setPlans(relevant);
        setSelectedPlanId('');
    }
  }, [date, tab, editEntry, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const normalizedDate = (date || '').trim().split(' ')[0];

    if (!editEntry && currentOffDay) {
        alert(`ACCESS DENIED: ${normalizedDate} is a Public Holiday (${currentOffDay.description}).`);
        setIsSubmitting(false);
        return;
    }

    const currentData = StorageService.getProductionData();

    try {
        if (editEntry) {
            const newQty = parseFloat(quantity || '0');
            const newManpower = parseFloat(manpower || '0');
            const updated = currentData.map(p => {
                if (p.id === editEntry.id) {
                    return { 
                        ...p, 
                        date: normalizedDate, category, process, productName: productName.toUpperCase(), unit,
                        planQuantity: tab === 'Plan' ? newQty : p.planQuantity,
                        actualQuantity: tab === 'Actual' ? newQty : p.actualQuantity,
                        batchNo: batchNo.toUpperCase(), manpower: newManpower, remark: remark.toUpperCase(),
                        lastUpdatedBy: user!.id, updatedAt: getDbTimestamp()
                    };
                }
                return p;
            });
            await StorageService.saveProductionData(updated);
            StorageService.addLog({
              userId: user!.id, userName: user!.name, action: 'EDIT_RECORD',
              details: `Modified record: ${productName.toUpperCase()} (${normalizedDate})`
            });
        } else {
            if (tab === 'Plan') {
                const newEntry: ProductionEntry = {
                    id: Date.now().toString(), date: normalizedDate, 
                    category, process, productName: productName.toUpperCase(), unit,
                    planQuantity: parseFloat(quantity || '0'), actualQuantity: 0,
                    remark: remark.toUpperCase(), lastUpdatedBy: user!.id, updatedAt: getDbTimestamp()
                };
                await StorageService.saveProductionData([...currentData, newEntry]);
                StorageService.addLog({
                  userId: user!.id, userName: user!.name, action: 'CREATE_PLAN',
                  details: `Planned ${newEntry.planQuantity} ${newEntry.unit} for ${newEntry.productName} (${normalizedDate})`
                });
            } else {
                if (!selectedPlanId) throw new Error("Select a plan first");
                const updated = currentData.map(p => {
                    if (p.id === selectedPlanId) {
                        return { 
                            ...p, 
                            actualQuantity: parseFloat(quantity || '0'), batchNo: batchNo.toUpperCase(), manpower: parseFloat(manpower || '0'),
                            remark: remark.toUpperCase(), lastUpdatedBy: user!.id, updatedAt: getDbTimestamp()
                        };
                    }
                    return p;
                });
                await StorageService.saveProductionData(updated);
                StorageService.addLog({
                  userId: user!.id, userName: user!.name, action: 'RECORD_ACTUAL',
                  details: `Recorded actuals for ${productName.toUpperCase()} (${normalizedDate})`
                });
            }
        }
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'SYSTEM UPDATED SUCCESSFULLY', type: 'success' } }));
        triggerRefresh();
        onClose();
    } catch (err: any) {
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: err.message || 'Operation failed', type: 'info' } }));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 relative animate-in fade-in zoom-in duration-300">
        
        {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Synchronizing with Cloud</p>
            </div>
        )}

        <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            {!editEntry ? (
              <>
                <button onClick={() => setTab('Plan')} 
                    className={`flex-1 py-5 font-black text-xs uppercase tracking-widest transition-all border-b-4 ${tab === 'Plan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    Plan Mode
                </button>
                <button onClick={() => setTab('Actual')} 
                    className={`flex-1 py-5 font-black text-xs uppercase tracking-widest transition-all border-b-4 ${tab === 'Actual' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    Actual Mode
                </button>
              </>
            ) : (
              <div className="flex-1 py-5 font-black text-xs uppercase tracking-[0.2em] text-center text-indigo-600 border-b-4 border-indigo-600">
                Update Production Log
              </div>
            )}
        </div>

        <div className="p-10 relative max-h-[80vh] overflow-y-auto custom-scrollbar">
            <button onClick={onClose} className="absolute top-2 right-4 text-slate-300 hover:text-rose-500 transition-colors z-20"><X className="w-6 h-6" /></button>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Production Schedule Date</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClasses} />
                    
                    {currentOffDay && (
                      <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-center gap-4 animate-pulse">
                        <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg">
                          <Palmtree className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">Public Holiday Restriction</p>
                          <p className="text-sm font-black text-slate-900 dark:text-amber-50">{currentOffDay.description || 'OFF DAY'}</p>
                        </div>
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      </div>
                    )}
                </div>

                {tab === 'Plan' || editEntry ? (
                    <>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Category</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value as Category)} 
                                    className={inputClasses}
                                    disabled={user?.role === 'operator' || user?.role === 'planner'}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Process Stage</label>
                                <select value={process} onChange={e => setProcess(e.target.value as ProcessType)} className={inputClasses}>
                                    {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Product Identification</label>
                            <input type="text" required value={productName} onChange={e => setProductName(e.target.value.toUpperCase())} className={`${inputClasses} uppercase`} placeholder="Enter full product name..." />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Target Qty</label>
                                    <input type="number" step="any" required min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClasses} />
                                </div>
                                <div className="w-32">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Unit</label>
                                    <select value={unit} onChange={e => setUnit(e.target.value as UnitType)} className={inputClasses}>
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            {editEntry && (
                              <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Staff Force</label>
                                  <input type="number" step="0.01" required min="0" value={manpower} onChange={e => setManpower(e.target.value)} className={inputClasses} />
                              </div>
                            )}
                        </div>
                        {editEntry && (
                          <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Internal Batch No</label>
                              <input type="text" value={batchNo} onChange={e => setBatchNo(e.target.value.toUpperCase())} className={`${inputClasses} uppercase`} />
                          </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Operation Remarks</label>
                            <textarea value={remark} onChange={e => setRemark(e.target.value.toUpperCase())} className={`${inputClasses} h-24 font-normal resize-none text-sm uppercase`} placeholder="Add manufacturing notes..." />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-6">
                             <div className="flex items-center justify-between mb-3">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Link to Existing Plan</label>
                                {user?.role === 'operator' && user.category && (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                        <ShieldCheck className="w-3 h-3" /> {user.category} Dept only
                                    </span>
                                )}
                             </div>
                             {plans.length === 0 ? <div className="text-xs text-slate-400 italic text-center p-10 border-4 border-dashed rounded-[2rem] dark:border-slate-700">No active plans detected for this date.</div> : (
                                 <div className="max-h-60 overflow-y-auto border-2 rounded-[2rem] p-3 space-y-2 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar">
                                     {plans.map(p => (
                                         <div key={p.id} onClick={() => { setSelectedPlanId(p.id); setProductName(p.productName.toUpperCase()); }}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all ${selectedPlanId === p.id ? 'bg-indigo-600 text-white shadow-xl scale-[0.98]' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <div className="font-black text-base">{p.productName}</div>
                                            <div className={`text-[10px] font-bold uppercase ${selectedPlanId === p.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                {p.category} • {p.process} • Planned: {p.planQuantity} {p.unit || 'KG'}
                                            </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                        {selectedPlanId && (
                            <>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Measured Actual</label>
                                        <input type="number" step="any" required value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Staff Units</label>
                                        <input type="number" step="0.01" required value={manpower} onChange={e => setManpower(e.target.value)} className={inputClasses} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Verified Batch No</label>
                                    <input type="text" required value={batchNo} onChange={e => setBatchNo(e.target.value.toUpperCase())} className={`${inputClasses} uppercase`} placeholder="Enter official batch ID..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Production Remark</label>
                                    <textarea value={remark} onChange={e => setRemark(e.target.value.toUpperCase())} className={`${inputClasses} h-24 font-normal resize-none text-sm uppercase`} placeholder="Note any variances or issues..." />
                                </div>
                            </>
                        )}
                    </>
                )}

                <button 
                    type="submit" 
                    disabled={isSubmitting || (!editEntry && !!currentOffDay)} 
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-white mt-4 shadow-2xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        !!currentOffDay && !editEntry ? 'bg-rose-500' : 
                        tab === 'Plan' ? 'bg-indigo-600 shadow-indigo-500/30' : 
                        'bg-emerald-600 shadow-emerald-500/30'
                    }`}
                >
                    {isSubmitting ? 'Processing...' : (!!currentOffDay && !editEntry ? 'Holiday Blocked' : 'Commit to Database')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
