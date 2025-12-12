import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Leaf, Moon, Sun, Stars } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-paper dark:bg-space-950 relative overflow-x-hidden transition-colors duration-500">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          {theme === 'nature' ? (
              <>
                 {/* Nature: Soft Blobs */}
                <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-green-100/40 rounded-full blur-[120px] transition-opacity duration-1000" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-amber-100/40 rounded-full blur-[120px] transition-opacity duration-1000" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]"></div>
              </>
          ) : (
              <>
                 {/* Space: Nebula & Stars */}
                 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-space-900 via-space-950 to-black opacity-80" />
                 <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[120px] animate-pulse" />
                 <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-cyan-900/20 rounded-full blur-[100px]" />
                 
                 {/* CSS Stars */}
                 {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute bg-white rounded-full animate-twinkle"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            animationDelay: `${Math.random() * 4}s`,
                            opacity: Math.random() * 0.7
                        }}
                    />
                 ))}
              </>
          )}
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-md bg-paper/80 dark:bg-space-950/80 border-b border-stone-200/50 dark:border-space-800 shadow-sm transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className={`p-2 rounded-xl shadow-lg transition-all duration-300 transform group-hover:rotate-6 ${theme === 'nature' ? 'bg-gradient-to-br from-nature-500 to-nature-700 shadow-nature-500/20' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'}`}>
                {theme === 'nature' ? <Leaf className="h-6 w-6 text-white fill-white/20" /> : <Stars className="h-6 w-6 text-white fill-white/20" />}
            </div>
            <h1 className="text-xl font-bold text-stone-800 dark:text-white tracking-tight group-hover:text-nature-700 dark:group-hover:text-space-accent transition-colors">
              Friendly <span className={theme === 'nature' ? 'text-nature-600' : 'text-space-accent'}>Classroom</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-stone-100 dark:bg-space-800 text-stone-500 dark:text-space-accent hover:bg-stone-200 dark:hover:bg-space-700 transition-colors"
                title={`Switch to ${theme === 'nature' ? 'Space' : 'Nature'} Theme`}
            >
                {theme === 'nature' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {user && (
                <div className="flex items-center space-x-4">
                <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-sm font-bold text-stone-700 dark:text-slate-200 font-serif">{user.name}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full w-fit ml-auto border ${theme === 'nature' ? 'text-nature-600 bg-nature-100 border-nature-200' : 'text-space-accent bg-space-900 border-space-700'}`}>{user.role}</span>
                </div>
                <button 
                    onClick={logout}
                    className="p-2 hover:bg-stone-100 dark:hover:bg-space-800 text-stone-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-all duration-300"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </button>
                </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 relative z-10">
        {children}
      </main>
      <footer className="py-8 text-center text-stone-400 dark:text-slate-600 text-xs font-serif italic border-t border-stone-100 dark:border-space-900 mt-auto transition-colors">
        <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-space-800"></span>
            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-space-800"></span>
            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-space-800"></span>
        </div>
        &copy; {new Date().getFullYear()} Friendly Classroom. {theme === 'nature' ? 'Cultivating knowledge.' : 'Exploring the universe of learning.'}
      </footer>
    </div>
  );
};