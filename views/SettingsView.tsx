import React from 'react';
import { Card, Button, Input } from '../components/UIComponents';
import { User } from '../types';
import { ICONS } from '../constants';

interface SettingsViewProps {
  user: User;
  darkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, darkMode, toggleTheme, onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Settings & Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card className="flex flex-col items-center text-center h-full">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
              <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full border-4 border-white dark:border-slate-900 bg-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">@{user.username}</p>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
              {user.role}
            </span>
            
            <div className="mt-8 w-full pt-8 border-t border-slate-200 dark:border-white/10">
               <Button onClick={onLogout} variant="danger" className="w-full justify-center">
                 {ICONS.LogOut} Sign Out
               </Button>
            </div>
          </Card>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Appearance">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-orange-100 text-orange-500'}`}>
                    {darkMode ? ICONS.Moon : ICONS.Sun}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Dark Mode</h4>
                    <p className="text-xs text-slate-500">Adjust the interface theme</p>
                  </div>
               </div>
               <button 
                  onClick={toggleTheme}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
               >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
               </button>
            </div>
          </Card>

          <Card title="Account Details">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                    <Input defaultValue={user.name} disabled className="opacity-70" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Username</label>
                    <Input defaultValue={user.username} disabled className="opacity-70" />
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Address</label>
                 <Input defaultValue="demo.user@r-ai.corp" disabled className="opacity-70" />
              </div>
            </div>
          </Card>

          <Card title="API Configuration">
             <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your API key is currently managed via environment variables for security.
                  To use paid features (Veo, Imagen 3), you will be prompted to select a key via the AI Studio integration.
                </p>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 break-all border border-slate-200 dark:border-slate-700">
                   API_KEY: ***************************
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};