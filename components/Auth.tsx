import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, User } from '../types';
import { ScanFace, Fingerprint, Sprout, BookOpen, Rocket } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  // Student
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  // Teacher
  const [idCardDetails, setIdCardDetails] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!name || !email || !mobile || !password) {
        setError("Please fill all required fields");
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        mobile,
        role,
        course: role === UserRole.STUDENT ? course : undefined,
        branch: role === UserRole.STUDENT ? branch : undefined,
        semester: role === UserRole.STUDENT ? semester : undefined,
        idCardDetails: role === UserRole.TEACHER ? idCardDetails : undefined
      };
      const success = await register(newUser);
      if (!success) setError("Registration failed (User might exist)");
    } else {
      const success = await login(email);
      if (!success) setError("User not found");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="relative w-full max-w-md">
        {/* Decorative Icon */}
        <div className={`absolute -top-6 -left-6 animate-pulse ${theme === 'nature' ? 'text-nature-200' : 'text-indigo-500/50'}`}>
            {theme === 'nature' ? <Sprout size={64} /> : <Rocket size={64} />}
        </div>

        <div className="bg-white/80 dark:bg-space-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-space-950/80 border border-stone-100 dark:border-space-800 transition-colors">
            <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-colors ${theme === 'nature' ? 'bg-nature-50 text-nature-600 border-nature-100' : 'bg-space-800 text-space-accent border-space-700'}`}>
                    <BookOpen size={32} />
                </div>
                <h2 className="text-3xl font-bold text-stone-800 dark:text-white font-serif">
                {isRegistering ? 'Join the Class' : 'Welcome Back'}
                </h2>
                <p className="text-stone-500 dark:text-slate-400 mt-2 text-sm">
                    {isRegistering ? 'Start your learning journey today.' : 'Sign in to access your classroom.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <div className="flex gap-4 p-1.5 bg-stone-100 dark:bg-space-950 rounded-xl mb-6 transition-colors">
                <button
                    type="button"
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${role === UserRole.STUDENT ? 'bg-white dark:bg-space-800 text-nature-700 dark:text-space-accent ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-slate-500 hover:bg-stone-200/50 dark:hover:bg-space-800/50 shadow-none'}`}
                    onClick={() => setRole(UserRole.STUDENT)}
                >
                    Student
                </button>
                <button
                    type="button"
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${role === UserRole.TEACHER ? 'bg-white dark:bg-space-800 text-nature-700 dark:text-space-accent ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-slate-500 hover:bg-stone-200/50 dark:hover:bg-space-800/50 shadow-none'}`}
                    onClick={() => setRole(UserRole.TEACHER)}
                >
                    Teacher
                </button>
                </div>
            )}

            <div className="space-y-3">
                {isRegistering && (
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                )}

                <input type="email" placeholder="Gmail ID" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                
                <input type="password" placeholder="Security Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />

                {isRegistering && (
                    <>
                    <input type="tel" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                    
                    {role === UserRole.STUDENT && (
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Course" value={course} onChange={e => setCourse(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                            <input type="text" placeholder="Sem" value={semester} onChange={e => setSemester(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                            <input type="text" placeholder="Branch" value={branch} onChange={e => setBranch(e.target.value)} className="col-span-2 w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                        </div>
                    )}

                    {role === UserRole.TEACHER && (
                        <input type="text" placeholder="ID Card Details" value={idCardDetails} onChange={e => setIdCardDetails(e.target.value)} className="w-full p-3.5 bg-stone-50 dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-600 dark:text-white" />
                    )}
                    </>
                )}
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50">{error}</p>}

            <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] ${theme === 'nature' ? 'bg-nature-600 hover:bg-nature-700 shadow-nature-600/20 hover:shadow-nature-600/40' : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-indigo-500/30'}`}>
                {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
            </form>

            {!isRegistering && (
            <div className="mt-8 flex justify-center">
                <button className="flex flex-col items-center gap-2 text-stone-400 dark:text-slate-500 hover:text-nature-600 dark:hover:text-space-accent transition-colors group" title="Simulate biometric">
                    <div className="p-3 border-2 border-dashed border-stone-200 dark:border-space-700 rounded-full group-hover:border-nature-300 dark:group-hover:border-space-accent">
                        <Fingerprint className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Biometric Login</span>
                </button>
            </div>
            )}

            <div className="mt-8 text-center pt-6 border-t border-stone-100 dark:border-space-800">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-nature-700 dark:text-space-accent hover:text-nature-800 dark:hover:text-white font-bold text-sm">
                {isRegistering ? 'Already have an account? Login' : 'New here? Create an account'}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};