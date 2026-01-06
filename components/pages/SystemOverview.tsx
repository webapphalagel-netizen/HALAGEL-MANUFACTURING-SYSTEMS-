
import React from 'react';
import { 
  ShieldCheck, Cloud, LayoutDashboard, Zap, 
  Users, BarChart3, ChevronRight, Binary, 
  Database, Globe, Layers, Cpu, Server, 
  Lock, MousePointer2, Sparkles, TrendingUp
} from 'lucide-react';
import { DEFAULT_AVATARS } from '../../constants';

export const SystemOverview: React.FC = () => {
  const features = [
    {
      icon: <LayoutDashboard className="w-6 h-6" />,
      title: "Intelligent Dashboard",
      desc: "Real-time visualization of monthly KPIs, department health, and operational momentum with dynamic filtering."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Role-Based Governance",
      desc: "Strict access control ensuring data integrity. Planners schedule, Operators execute, and Managers analyze."
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Cloud-Bridge Architecture",
      desc: "Enterprise-grade synchronization with Google Sheets, offering a robust, collaborative cloud database with zero hosting costs."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Operational Velocity",
      desc: "Immediate identification of manufacturing bottlenecks through automated efficiency calculations and trend analysis."
    }
  ];

  const workflow = [
    { step: "01", actor: "Planner", action: "Job Scheduling", detail: "Sets targets and specifications in the monthly production calendar." },
    { step: "02", actor: "Operator", action: "Execution Log", detail: "Records real-time output, batch IDs, and manpower from the production floor." },
    { step: "03", actor: "System", action: "Cloud Sync", detail: "Automatically pushes local logs to the encrypted cloud database via Google API." },
    { step: "04", actor: "Manager", action: "Intelligence Analysis", detail: "Generates automated efficiency reports and audits staff performance metrics." }
  ];

  const techHighlights = [
    { icon: <Lock className="w-5 h-5" />, label: "Security", val: "SHA-256 Hashing Ready" },
    { icon: <Globe className="w-5 h-5" />, label: "Mobility", val: "PWA & Mobile Ready" },
    { icon: <Server className="w-5 h-5" />, label: "Storage", val: "Hybrid Cloud/Local" },
    { icon: <Layers className="w-5 h-5" />, label: "Stack", val: "React 19 + Vite" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-24 pb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      {/* 1. HERO SECTION: THE VISION */}
      <div className="text-center space-y-8 pt-16">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] shadow-sm">
          <Binary className="w-3.5 h-3.5" /> HALAGEL System Intelligence v2.5
        </div>
        <h1 className="text-7xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]">
          The Future of <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500">Manufacturing.</span>
        </h1>
        <p className="text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
          A high-performance production ecosystem engineered to transform raw operational data into actionable manufacturing intelligence.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
           <div className="flex -space-x-4">
              <img src={DEFAULT_AVATARS.MAN} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 shadow-lg" alt="User 1"/>
              <img src={DEFAULT_AVATARS.WOMAN_HIJAB} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 shadow-lg" alt="User 2"/>
              <div className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg">99+</div>
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Multi-User Role Environment</p>
        </div>
      </div>

      {/* 2. CORE CAPABILITIES: THE PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((f, i) => (
          <div key={i} className="glass-panel p-12 rounded-[3.5rem] border border-gray-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-inner">
              {f.icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{f.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. WORKFLOW PIPELINE: THE PROCESS */}
      <div className="space-y-16">
        <div className="text-center">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-3">Operational Cycle</h3>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Standard Operating Procedure</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
            {workflow.map((w, i) => (
              <div key={i} className="relative group">
                <div className="bg-white dark:bg-slate-850 p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 h-full flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-all border-b-8 border-b-transparent hover:border-b-indigo-500">
                    <span className="text-5xl font-black text-slate-100 dark:text-slate-800 mb-6 group-hover:text-indigo-500/10 transition-colors font-mono">{w.step}</span>
                    <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full mb-6 tracking-widest shadow-lg shadow-indigo-500/20">{w.actor}</div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">{w.action}</h4>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{w.detail}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10 opacity-20">
                    <ChevronRight className="w-10 h-10 text-indigo-500" />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 4. IMPACT SECTION: WHY IT MATTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-emerald-50/50 dark:bg-emerald-900/10 p-12 md:p-20 rounded-[4rem] border border-emerald-100 dark:border-emerald-900/20">
          <div className="space-y-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl w-fit">
                  <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Measurable Impact</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  By digitizing the Halagel production line, we reduce manual reporting errors by 98% and increase management response time to bottlenecks from days to seconds.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                      <p className="text-3xl font-black text-emerald-600">Zero</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Paper Waste</p>
                  </div>
                  <div className="space-y-1">
                      <p className="text-3xl font-black text-indigo-600">Real-Time</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transparency</p>
                  </div>
              </div>
          </div>
          <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
              <div className="relative glass-panel p-8 rounded-[3rem] border border-white shadow-2xl">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Live Efficiency Status
                  </h4>
                  <div className="space-y-4">
                      {['Healthcare', 'Toothpaste', 'Rocksalt'].map(cat => (
                          <div key={cat} className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                  <span>{cat} Unit</span>
                                  <span className="text-indigo-600">92%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '92%' }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* 5. TECH STACK FOOTER */}
      <div className="bg-[#0f172a] rounded-[4rem] p-16 text-white overflow-hidden relative border border-white/5">
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
             <Cpu className="w-80 h-80" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
              <div className="space-y-8 flex-1">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight mb-4">The Digital Backbone</h3>
                    <p className="text-base text-slate-400 max-w-lg font-medium leading-relaxed">
                        Engineered with a modern React 19 architecture to handle heavy data processing without compromising on user experience or aesthetic precision.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                      {['React 19', 'Tailwind CSS', 'Vite 6', 'Google Cloud', 'Recharts', 'Lucide'].map(tech => (
                        <span key={tech} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors">{tech}</span>
                      ))}
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full lg:w-auto shrink-0">
                  {techHighlights.map((th, i) => (
                    <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl hover:bg-white/10 transition-all cursor-default">
                        <div className="text-indigo-400 mb-4">{th.icon}</div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest">{th.label}</p>
                        <p className="text-sm font-black uppercase tracking-tighter whitespace-nowrap">{th.val}</p>
                    </div>
                  ))}
              </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 opacity-40">
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Proprietary HALAGEL System Architecture</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Cloud Network Active</span>
              </div>
          </div>
      </div>
    </div>
  );
};
