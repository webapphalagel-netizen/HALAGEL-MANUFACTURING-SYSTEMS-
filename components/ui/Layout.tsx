
import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { Category, ProductionEntry } from '../../types';
import { CATEGORIES } from '../../constants';
import { LoginModal } from '../modals/LoginModal';
import { InputModal } from '../modals/InputModal';
import { UserModal } from '../modals/UserModal';
import { OffDayModal } from '../modals/OffDayModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { AvatarModal } from '../modals/AvatarModal';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { StorageService } from '../../services/storageService';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, Plus, LogOut, Database,
  CalendarX, LayoutDashboard, RefreshCw, LogIn, CheckCircle, Info, Bell,
  ClipboardList, Users, History, Key, BarChart3, Camera
} from 'lucide-react';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const { category, setCategory, isDarkMode, toggleDarkMode, triggerRefresh } = useDashboard();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showOffDays, setShowOffDays] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ProductionEntry | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const timeoutRef = useRef<number | null>(null);

  const handleNotify = useCallback((e: any) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setNotification({ message: e.detail.message, type: e.detail.type || 'success' });
    timeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      timeoutRef.current = null;
    }, 2000);
  }, []);

  const handleEditEntry = useCallback((e: any) => {
    setEntryToEdit(e.detail);
    setShowInput(true);
  }, []);

  const handleLogout = () => {
    const userName = user?.name || 'User';
    logout();
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message: `LOGOUT SUCCESSFUL: GOODBYE ${userName.toUpperCase()}`, type: 'success' } 
    }));
    setIsMobileMenuOpen(false);
  };

  const handleSync = async (silent = false) => {
    if (!GoogleSheetsService.isEnabled()) {
      if (!silent) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'DATABASE NOT CONFIGURED. PLEASE SET URL IN USER MANAGEMENT.', type: 'info' } 
        }));
      }
      return;
    }
    
    if (!silent) setIsSyncing(true);
    try {
      await StorageService.syncWithSheets();
      triggerRefresh();
      if (!silent) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'CLOUD DATA SYNCHRONIZED', type: 'success' } 
        }));
      }
    } catch (e) {
      if (!silent) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'SYNC FAILED - CHECK CONNECTION', type: 'info' } 
        }));
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (GoogleSheetsService.isEnabled()) {
      handleSync(true); 
    }
  }, []);

  useEffect(() => {
    window.addEventListener('app-notification', handleNotify);
    window.addEventListener('edit-production-entry', handleEditEntry);
    return () => {
      window.removeEventListener('app-notification', handleNotify);
      window.removeEventListener('edit-production-entry', handleEditEntry);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [handleNotify, handleEditEntry]);

  const navItemClass = (path: string) => `
    w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all
    ${location.pathname === path 
      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm' 
      : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}
  `;

  const sidebarButtonClass = `
    w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all
    text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800
  `;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans`}>
      {notification && (
        <div className="fixed top-20 right-8 z-[10000] pointer-events-none w-full max-w-sm px-4">
          <div className="notification-animate pointer-events-auto">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 bg-white dark:bg-slate-800 ${
              notification.type === 'success' ? 'border-emerald-500/50' : 'border-indigo-500/50'
            }`}>
              <div className={`p-2 rounded-xl shadow-inner ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 flex items-center gap-1 ${
                  notification.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'
                }`}>
                  System Alert
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-850 border-r border-gray-200 dark:border-slate-700 z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col items-center justify-center border-b border-gray-100 dark:border-slate-800">
           <div className="w-56 text-center">
             <div className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white mb-1">
                HALA<span className="text-emerald-500">GEL</span>
             </div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Manufacturing System</p>
           </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/')}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/reports')}>
            <ClipboardList className="w-5 h-5" /> Production Reports
          </Link>
          <Link to="/process-analytics" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/process-analytics')}>
            <BarChart3 className="w-5 h-5" /> Process Analytics
          </Link>

          <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Departments</div>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat as Category); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${
                category === cat ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}>
              {cat}
            </button>
          ))}

          {user && (
            <>
              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Operations</div>
              <button onClick={() => { setShowInput(true); setIsMobileMenuOpen(false); }} className={sidebarButtonClass}>
                <Plus className="w-5 h-5 text-emerald-500" /> New Entry
              </button>
              
              {hasPermission(['admin', 'manager']) && (
                <button onClick={() => { setShowOffDays(true); setIsMobileMenuOpen(false); }} className={sidebarButtonClass}>
                  <CalendarX className="w-5 h-5 text-rose-500" /> Public Holidays
                </button>
              )}

              {hasPermission(['admin']) && (
                <Link to="/users" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/users')}>
                  <Users className="w-5 h-5" /> User Management
                </Link>
              )}

              <Link to="/logs" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/logs')}>
                <History className="w-5 h-5" /> Activity Logs
              </Link>

              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Account</div>
              <button onClick={() => { setShowAvatarModal(true); setIsMobileMenuOpen(false); }} className={sidebarButtonClass}>
                <Camera className="w-5 h-5 text-emerald-500" /> Profile Picture
              </button>
              <button onClick={() => { setShowChangePass(true); setIsMobileMenuOpen(false); }} className={sidebarButtonClass}>
                <Key className="w-5 h-5 text-indigo-500" /> Change Password
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 text-[13px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                <LogOut className="w-5 h-5" /> Log Out
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-black text-lg hidden md:block text-slate-700 dark:text-white capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</h2>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                GoogleSheetsService.isEnabled() ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Database className="w-3 h-3" />
                {GoogleSheetsService.isEnabled() ? 'DB Connected' : 'Local Only'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => handleSync()} disabled={isSyncing} className={`p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${isSyncing ? 'animate-spin text-indigo-500' : ''}`}>
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={toggleDarkMode} className="p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <div 
                onClick={() => setShowAvatarModal(true)} 
                className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white overflow-hidden shadow-inner">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs font-bold uppercase">{user.name.charAt(0)}</span>
                    )}
                 </div>
                 <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-black uppercase text-indigo-500 leading-none">
                      {user.role === 'manager' ? 'manager/HOD' : user.role}
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-white">{user.name}</p>
                 </div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
                <LogIn className="w-4 h-4" />Login
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showInput && <InputModal onClose={() => { setShowInput(false); setEntryToEdit(null); }} editEntry={entryToEdit} />}
      {showOffDays && <OffDayModal onClose={() => setShowOffDays(false)} />}
      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
      {showAvatarModal && <AvatarModal onClose={() => setShowAvatarModal(false)} />}
    </div>
  );
};
