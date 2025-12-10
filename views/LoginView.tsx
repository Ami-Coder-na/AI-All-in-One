import React, { useState } from 'react';
import { Button, Input, Loader } from '../components/UIComponents';
import { ICONS } from '../constants';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (username.toLowerCase() === 'demo' && password === 'password') {
      onLogin({
        username: 'demo',
        name: 'Demo User',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
        role: 'Enterprise Administrator'
      });
    } else {
      setError('Invalid credentials. Try "demo" / "password"');
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onLogin({
        username: 'demo',
        name: 'Demo User',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
        role: 'Enterprise Administrator'
      });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !password) {
        setError("Please fill in all fields");
        return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onLogin({
        username: username,
        name: fullName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
        role: 'Standard User'
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-8 rounded-3xl shadow-2xl transition-all duration-500">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4 transform transition-transform hover:scale-110 hover:rotate-3">
              <div className="scale-150">{ICONS.Spark}</div>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">R Ai</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{isSignUp ? 'Create your futuristic identity' : 'Enterprise Access Portal'}</p>
          </div>

          {!isSignUp ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{ICONS.User}</div>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="pl-11" placeholder="Enter username" />
                </div>
                </div>

                <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{ICONS.Lock}</div>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" placeholder="Enter password" />
                </div>
                </div>

                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium text-center animate-in shake">{error}</div>}

                <div className="space-y-3 pt-2">
                    <Button type="submit" disabled={loading} className="w-full py-4 text-lg font-bold shadow-blue-500/20">
                    {loading ? <Loader /> : 'Sign In'}
                    </Button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">OR QUICK ACCESS</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleQuickDemo}
                        disabled={loading}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                    >
                        {ICONS.Spark} One-Click Demo Login
                    </button>
                </div>
            </form>
          ) : (
             /* SIGN UP FORM */
             <form onSubmit={handleSignUp} className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-300">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johnd" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />
                    </div>
                 </div>

                 {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium text-center animate-in shake">{error}</div>}

                 <Button type="submit" disabled={loading} className="w-full py-4 text-lg font-bold shadow-blue-500/20">
                   {loading ? <Loader /> : 'Create Account'}
                 </Button>
             </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
             <button 
               type="button"
               onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
               className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
             >
               {isSignUp ? 'Already have an account? Sign In' : 'New here? Create an Account'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};