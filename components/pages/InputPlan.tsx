
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, PROCESSES, UNITS } from '../../constants';
import { StorageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { ProductionEntry } from '../../types';
import { AlertCircle, CheckCircle2, Palmtree, AlertTriangle } from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';

export const InputPlan: React.FC = () => {
  const { user } = useAuth();
  const { triggerRefresh } = useDashboard();
  const [formData, setFormData] = useState({
    date: getTodayISO(),
    category: CATEGORIES[0],
    process: PROCESSES[0],
    productName: '',
    quantity: '',
    unit: UNITS[0],
    remark: ''
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const offDays = useMemo(() => StorageService.getOffDays(), []);
  
  // Standardized Date Comparison
  const currentOffDay = useMemo(() => {
    const cleanDate = (formData.date || '').trim().split(' ')[0];
    return offDays.find(od => (od.date || '').trim().split(' ')[0] === cleanDate);
  }, [formData.date, offDays]);

  useEffect(() => {
    if (currentOffDay) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: `RESTRICTED DATE: ${currentOffDay.description}`, type: 'info' } 
        }));
    }
  }, [currentOffDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // FINAL SERVER-SIDE STYLE BLOCK
    if (currentOffDay) {
      setMsg({ type: 'error', text: `CRITICAL: Production entry is prohibited on ${currentOffDay.description}.` });
      return;
    }

    if (!formData.productName || !formData.quantity) {
      setMsg({ type: 'error', text: 'Required fields are missing.' });
      return;
    }

    try {
      const entries = StorageService.getProductionData();
      
      const newEntry: ProductionEntry = {
        id: Date.now().toString(),
        date: formData.date,
        category: formData.category as any,
        process: formData.process as any,
        productName: formData.productName.toUpperCase(),
        planQuantity: parseFloat(formData.quantity),
        actualQuantity: 0,
        unit: formData.unit as any,
        remark: formData.remark.toUpperCase(),
        lastUpdatedBy: user!.id,
        updatedAt: new Date().toISOString()
      };

      await StorageService.saveProductionData([...entries, newEntry]);
      StorageService.addLog({
        userId: user!.id,
        userName: user!.name,
        action: 'CREATE_PLAN',
        details: `Created production plan for ${newEntry.productName} on ${newEntry.date}`
      });

      triggerRefresh();
      setMsg({ type: 'success', text: 'Plan successfully committed to cloud.' });
      setFormData(prev => ({ ...prev, productName: '', quantity: '', remark: '' }));
      
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'PLANNING COMPLETE', type: 'success' } 
      }));
    } catch (err) {
      setMsg({ type: 'error', text: 'Cloud synchronization failed.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-700 p-12">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Strategic Planning</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Initialize production targets</p>
        </div>
        
        {msg && (
          <div className={`p-6 rounded-2xl mb-8 flex items-center gap-4 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-100' : 'bg-rose-50 text-rose-700 border-2 border-rose-100'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
            <span className="font-black text-xs uppercase tracking-widest">{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Calendar Date</label>
              <input 
                type="date" 
                required
                className="w-full px-5 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white font-black outline-none transition-all"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
              
              {currentOffDay && (
                <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-4 shadow-sm">
                  <Palmtree className="w-6 h-6 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Entry Prohibited</p>
                    <p className="text-sm font-black text-slate-800 dark:text-amber-100">{currentOffDay.description}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Department</label>
              <select 
                className="w-full px-5 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white font-black outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Processing Node</label>
              <select 
                className="w-full px-5 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white font-black outline-none transition-all"
                value={formData.process}
                onChange={e => setFormData({...formData, process: e.target.value as any})}
              >
                {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Production Target</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="any"
                  min="1"
                  required
                  className="flex-1 px-5 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white font-black outline-none transition-all"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                />
                <select 
                  className="w-32 px-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white font-black outline-none transition-all"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value as any})}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Product Description</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Healthcare Pain Relief Gel 50g"
              className="w-full px-5 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white font-black outline-none transition-all uppercase"
              value={formData.productName}
              onChange={e => setFormData({...formData, productName: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Detailed Remarks</label>
            <textarea 
              className="w-full px-5 py-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:bg-slate-900 dark:text-white h-32 resize-none font-medium text-sm uppercase"
              placeholder="Operational constraints or special instructions..."
              value={formData.remark}
              onChange={e => setFormData({...formData, remark: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={!!currentOffDay}
              className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-2xl uppercase tracking-[0.3em] text-xs hover:scale-[1.01] active:scale-[0.99] disabled:grayscale disabled:cursor-not-allowed ${
                currentOffDay ? 'bg-slate-400' : 'bg-indigo-600 shadow-indigo-500/30'
              }`}
            >
              {currentOffDay ? 'Locked (Public Holiday)' : 'Commit Planning Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
