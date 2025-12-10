import React, { useState, useEffect } from 'react';
import { AppSection } from './types';
import { ChatView } from './views/ChatView';
import { MediaGenView } from './views/MediaGenView';
import { AnalysisView } from './views/AnalysisView';
import { LiveView } from './views/LiveView';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [section, setSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const NavItem: React.FC<{ s: AppSection; label: string; icon: React.ReactNode; desc: string }> = ({ s, label, icon, desc }) => {
    const isActive = section === s;
    return (
      <button 
        onClick={() => setSection(s)}
        className={`group relative w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 ease-out border ${
            isActive 
              ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-xl shadow-blue-500/10' 
              : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
        }`}
      >
        {/* Active Indicator Pill */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full transition-all duration-300 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}`} />

        {/* Icon Box */}
        <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
            isActive 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 scale-100 rotate-0' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400'
        }`}>
            {icon}
        </div>

        {/* Text */}
        <div className="flex flex-col items-start">
            <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                {label}
            </span>
            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500'}`}>
                {desc}
            </span>
        </div>

        {/* Hover Glow Background */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <div className="w-80 relative z-20 flex-col p-6 hidden md:flex border-r border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="mb-10 flex items-center gap-3 px-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                {ICONS.Spark}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">Gemini Omni</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">Enterprise Demo</p>
            </div>
        </div>
        
        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2 py-2">
          <div>
             <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Core Platform</h3>
             <nav className="space-y-3">
                <NavItem s={AppSection.DASHBOARD} label="Overview" desc="System Dashboard" icon={ICONS.Spark} />
                <NavItem s={AppSection.CHAT} label="Smart Chat" desc="Thinking Model & Tools" icon={ICONS.Chat} />
                <NavItem s={AppSection.LIVE} label="Live Connection" desc="Real-time Voice/Video" icon={ICONS.Audio} />
             </nav>
          </div>
          
          <div>
             <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Creative Studio</h3>
             <nav className="space-y-3">
                <NavItem s={AppSection.MEDIA_GEN} label="Media Generator" desc="Veo Video & Imagen 3" icon={ICONS.Video} />
                <NavItem s={AppSection.ANALYSIS} label="Deep Analysis" desc="Vision & Data Processing" icon={ICONS.Analyze} />
             </nav>
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-200/50 dark:border-white/5">
          <div className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-white text-orange-500 shadow-sm'}`}>
                  {darkMode ? ICONS.Moon : ICONS.Sun}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</span>
                  <span className="text-[10px] text-slate-400">{darkMode ? 'On' : 'Off'}</span>
                </div>
             </div>
             <button 
                onClick={toggleTheme}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
             >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50">
         <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white">
              {ICONS.Spark}
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Gemini Omni</span>
         </div>
         <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? ICONS.Sun : ICONS.Moon}
         </button>
      </div>
      
      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2 p-2 z-40 shadow-sm">
          {[
              { id: AppSection.DASHBOARD, label: 'Dash', icon: ICONS.Spark },
              { id: AppSection.CHAT, label: 'Chat', icon: ICONS.Chat },
              { id: AppSection.LIVE, label: 'Live', icon: ICONS.Audio },
              { id: AppSection.MEDIA_GEN, label: 'Media', icon: ICONS.Video },
              { id: AppSection.ANALYSIS, label: 'Analysis', icon: ICONS.Analyze },
          ].map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    section === item.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                 {item.icon} {item.label}
              </button>
          ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col pt-[110px] md:pt-0">
        <header className="h-20 flex items-center justify-between px-8 hidden md:flex z-10 border-b border-slate-200/50 dark:border-white/5 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
           <div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight flex items-center gap-3">
               {section.replace('_', ' ')}
               <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">Beta</span>
             </h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold flex items-center gap-2 shadow-sm">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                 </span>
                 System Online
              </div>
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 custom-scrollbar scroll-smooth">
           {section === AppSection.DASHBOARD && (
             <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Welcome Hero */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                   <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-4 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                        New: Veo & Imagen 3 Integration
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Welcome to <br/>Gemini Omni.</h1>
                      <p className="text-blue-100 max-w-2xl text-lg mb-8 leading-relaxed">Experience the next generation of multimodal AI. Generate high-fidelity media, converse seamlessly in real-time, and analyze complex data streams with Gemini 2.5 and 3.0 models.</p>
                      <div className="flex flex-wrap gap-4">
                        <button onClick={() => setSection(AppSection.CHAT)} className="px-6 py-3.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                           {ICONS.Chat} Start Chatting
                        </button>
                        <button onClick={() => setSection(AppSection.MEDIA_GEN)} className="px-6 py-3.5 bg-blue-700/50 text-white border border-white/20 rounded-xl font-bold hover:bg-blue-700/70 transition-all backdrop-blur-md flex items-center gap-2">
                           {ICONS.Video} Create Media
                        </button>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { id: AppSection.CHAT, title: 'Smart Chat', desc: 'Thinking Mode & Grounding', icon: ICONS.Chat, color: 'blue', delay: '0ms' },
                     { id: AppSection.LIVE, title: 'Live API', desc: 'Real-time Audio/Video', icon: ICONS.Audio, color: 'purple', delay: '100ms' },
                     { id: AppSection.MEDIA_GEN, title: 'Media Studio', desc: 'Veo Video & Imagen 3', icon: ICONS.Video, color: 'pink', delay: '200ms' },
                     { id: AppSection.ANALYSIS, title: 'Analysis', desc: 'Vision & Transcription', icon: ICONS.Analyze, color: 'green', delay: '300ms' },
                   ].map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => setSection(item.id)} 
                        className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                        style={{ animationDelay: item.delay }}
                      >
                         <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-all duration-500 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 scale-150 text-${item.color}-500`}>{item.icon}</div>
                         <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400 flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            {item.icon}
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                         
                         <div className="mt-4 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                            Launch Tool <span className="ml-1">→</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {section === AppSection.CHAT && <ChatView />}
           {section === AppSection.LIVE && <LiveView />}
           {section === AppSection.MEDIA_GEN && <MediaGenView />}
           {section === AppSection.ANALYSIS && <AnalysisView />}
        </div>
      </main>
    </div>
  );
};

export default App;