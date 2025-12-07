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

  const NavItem: React.FC<{ s: AppSection; label: string; icon: React.ReactNode }> = ({ s, label, icon }) => (
    <button 
      onClick={() => setSection(s)}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left relative overflow-hidden ${
        section === s 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
      }`}
    >
      <span className={`relative z-10 transition-colors ${section === s ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>{icon}</span>
      <span className="relative z-10 font-medium">{label}</span>
      {section === s && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100 z-0"></div>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <div className="w-72 relative z-20 flex-col p-6 hidden md:flex border-r border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="mb-10 flex items-center gap-3 px-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-white shadow-lg shadow-blue-500/30">
              {ICONS.Spark}
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Gemini Omni</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Enterprise Demo</p>
            </div>
        </div>
        
        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
          <div>
             <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Platform</h3>
             <nav className="space-y-2">
                <NavItem s={AppSection.DASHBOARD} label="Dashboard" icon={ICONS.Spark} />
                <NavItem s={AppSection.CHAT} label="Smart Chat" icon={ICONS.Chat} />
                <NavItem s={AppSection.LIVE} label="Live Connection" icon={ICONS.Audio} />
             </nav>
          </div>
          
          <div>
             <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Creative Studio</h3>
             <nav className="space-y-2">
                <NavItem s={AppSection.MEDIA_GEN} label="Media Generator" icon={ICONS.Video} />
                <NavItem s={AppSection.ANALYSIS} label="Deep Analysis" icon={ICONS.Analyze} />
             </nav>
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-200/50 dark:border-white/5">
          <div className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-white/5">
             <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-white text-orange-500 shadow-sm'}`}>
                  {darkMode ? ICONS.Moon : ICONS.Sun}
                </div>
                <span className="text-sm font-medium">Dark Mode</span>
             </div>
             <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
             >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50">
         <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Gemini Omni</span>
         <div className="flex items-center gap-3">
           <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-400">
              {darkMode ? ICONS.Sun : ICONS.Moon}
           </button>
           <select 
             value={section} 
             onChange={(e) => setSection(e.target.value as AppSection)}
             className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm p-2 outline-none"
           >
              <option value={AppSection.DASHBOARD}>Dashboard</option>
              <option value={AppSection.CHAT}>Chat</option>
              <option value={AppSection.LIVE}>Live</option>
              <option value={AppSection.MEDIA_GEN}>Media</option>
              <option value={AppSection.ANALYSIS}>Analysis</option>
           </select>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col pt-16 md:pt-0">
        <header className="h-20 flex items-center justify-between px-8 hidden md:flex z-10">
           <div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">{section.replace('_', ' ')}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">AI Powered Workspace</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 All Systems Operational
              </div>
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 custom-scrollbar">
           {section === AppSection.DASHBOARD && (
             <div className="max-w-6xl mx-auto space-y-8">
                {/* Welcome Hero */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   <div className="relative z-10">
                      <h1 className="text-4xl font-bold mb-4">Welcome to the Future of AI.</h1>
                      <p className="text-blue-100 max-w-2xl text-lg mb-8">Explore the full capabilities of Gemini 3.0 Pro, Veo, and Live API. Generate high-fidelity media, converse in real-time, and analyze complex data.</p>
                      <button onClick={() => setSection(AppSection.CHAT)} className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">Start Creating</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { id: AppSection.CHAT, title: 'Smart Chat', desc: 'Thinking Mode & Grounding', icon: ICONS.Chat, color: 'blue' },
                     { id: AppSection.LIVE, title: 'Live API', desc: 'Real-time Audio/Video', icon: ICONS.Audio, color: 'purple' },
                     { id: AppSection.MEDIA_GEN, title: 'Media Studio', desc: 'Veo Video & Imagen 3', icon: ICONS.Video, color: 'pink' },
                     { id: AppSection.ANALYSIS, title: 'Analysis', desc: 'Vision & Transcription', icon: ICONS.Analyze, color: 'green' },
                   ].map((item) => (
                      <div key={item.id} onClick={() => setSection(item.id)} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                         <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity scale-150 text-${item.color}-500`}>{item.icon}</div>
                         <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400 flex items-center justify-center mb-4 text-xl`}>
                            {item.icon}
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
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