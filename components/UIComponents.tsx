import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "relative px-5 py-2.5 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] border border-blue-500/30",
    secondary: "bg-white/5 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700/50 backdrop-blur-sm",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50 hover:shadow-lg hover:shadow-red-500/10",
    ghost: "text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
  };
  
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10 flex items-center gap-2">{props.children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      )}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 transition-all duration-300 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-5">
        {title && <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="relative">{children}</div>
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 group-focus-within:opacity-50 transition duration-500 blur-sm"></div>
    <input 
      className={`relative w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-0 placeholder:text-slate-400 transition-all ${className}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <div className="relative group">
    <select 
      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer ${className}`} 
      {...props} 
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </div>
  </div>
);

export const Loader: React.FC = () => (
  <div className="flex items-center gap-1.5 h-6">
    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
  </div>
);

export const FileUpload: React.FC<{
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  accept: string;
  label?: string;
  multiple?: boolean;
}> = ({ onFileSelect, onFilesSelect, accept, label = "Upload File", multiple = false }) => {
  return (
    <label className="group relative cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 overflow-hidden">
      <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10 transition-transform group-hover:scale-105">
        <svg className="w-8 h-8 mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
        </svg>
        <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{label}</p>
        <p className="text-xs text-slate-400">{multiple ? 'Drag & drop multiple files' : 'Click to browse'}</p>
      </div>
      <input 
        type="file" 
        className="hidden" 
        accept={accept} 
        multiple={multiple}
        onChange={(e) => {
          if (multiple && e.target.files && onFilesSelect) {
            onFilesSelect(Array.from(e.target.files));
          } else if (!multiple && e.target.files?.[0] && onFileSelect) {
            onFileSelect(e.target.files[0]);
          }
        }} 
      />
    </label>
  );
};