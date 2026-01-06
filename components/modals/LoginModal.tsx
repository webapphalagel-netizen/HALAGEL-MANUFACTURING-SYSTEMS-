
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/storageService';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { X, Lock, User as UserIcon, Database, Check, AlertCircle, Smartphone } from 'lucide-react';

export const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [dbUrl, setDbUrl] = useState(localStorage.getItem('halagel_sheets_api_url') || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncUsers = async () => {
    if (!dbUrl.startsWith('https://')) {
        setError("Please enter a valid Database URL first.");
        return;
    }
    setIsSyncing(true);
    localStorage.setItem('halagel_sheets_api_url', dbUrl);
    try {
        await StorageService.syncWithSheets();
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: `CLOUD USERS SYNCHRONIZED`, type: 'success' } 
        }));
        setShowConfig(false);
        setError("");
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: 'Cloud connection active. Try logging in now.', type: 'info' } 
        }));
    } catch (e) {
        setError("Sync failed. Check URL or internet.");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: `Welcome ${username}! Access Granted.`, type: 'success' } 
      }));
      onClose();
    } else {
      setError('Invalid username or password.');
    }
  };

  const inputClasses = "w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="mb-8 flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-4">
                <Lock className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                Halagel Portal
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Production Governance System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg text-center font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
            </div>
          )}
          
          <div className="relative">
            <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input 
                type="text" placeholder="Username" required
                className={inputClasses}
                value={username} onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input 
                type="password" placeholder="Password" required
                className={inputClasses}
                value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-3.5 rounded-xl font-black hover:opacity-90 transition shadow-xl shadow-indigo-500/10 uppercase tracking-widest text-xs">
            Authenticate
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
            {!showConfig ? (
                <div className="space-y-4">
                    <button 
                        onClick={() => setShowConfig(true)}
                        className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                    >
                        <Database className="w-3 h-3" /> Configure Cloud Connection
                    </button>
                </div>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Sheets Bridge URL</p>
                    <input 
                        type="text" 
                        placeholder="https://script.google.com/..."
                        className="w-full p-3 text-[10px] font-mono border dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                        value={dbUrl}
                        onChange={e => setDbUrl(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSyncUsers}
                            disabled={isSyncing}
                            className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button 
                            onClick={() => setShowConfig(false)}
                            className="px-4 bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
