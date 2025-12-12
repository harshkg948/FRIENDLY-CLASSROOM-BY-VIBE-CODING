import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { ClassroomView } from './components/Classroom';
import { userService, classroomService } from './services/mockDatabase';
import { Classroom, UserRole } from './types';
import { Plus, Users, Book } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  
  // Create Class State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSem, setNewClassSem] = useState('');
  
  // Join Class State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  React.useEffect(() => {
    if (user) {
      if (user.role === UserRole.TEACHER) {
        setClassrooms(classroomService.listForTeacher(user.id));
      } else {
        setClassrooms(classroomService.listForStudent(user.id));
      }
    }
  }, [user, showCreateModal, showJoinModal]);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && newClassName && newClassSem) {
      classroomService.create({
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: newClassName,
        semester: newClassSem,
        teacherId: user.id,
        teacherName: user.name,
        students: [],
        schedule: "Mon: 10AM - Math\nWed: 2PM - Physics"
      });
      setShowCreateModal(false);
    }
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && joinCode) {
      const success = classroomService.join(joinCode, user.id);
      if (success) {
        setShowJoinModal(false);
        alert("Joined successfully!");
      } else {
        alert("Invalid Class ID");
      }
    }
  };

  if (selectedClass) {
    return <ClassroomView classroom={selectedClass} onBack={() => setSelectedClass(null)} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-serif text-stone-800 dark:text-white transition-colors">
          My Classrooms
        </h2>
        {user?.role === UserRole.TEACHER ? (
          <button onClick={() => setShowCreateModal(true)} className="bg-nature-700 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-nature-800 dark:hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/20 transition-all active:scale-95">
            <Plus className="w-5 h-5" /> Create Class
          </button>
        ) : (
          <button onClick={() => setShowJoinModal(true)} className="bg-white dark:bg-space-900 border-2 border-nature-600 dark:border-space-accent text-nature-700 dark:text-space-accent px-6 py-3 rounded-xl font-bold hover:bg-nature-50 dark:hover:bg-space-800 flex items-center gap-2 transition-all active:scale-95">
            <Plus className="w-5 h-5" /> Join Class
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classrooms.map(c => (
          <div key={c.id} onClick={() => setSelectedClass(c)} className="bg-white dark:bg-space-900/80 dark:backdrop-blur-xl p-8 rounded-[2rem] border border-stone-100 dark:border-space-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-space-950/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-indigo-500/10 transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-nature-50 dark:bg-indigo-500/10 rounded-bl-full -z-0 transition-transform group-hover:scale-110 origin-top-right"></div>
            
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white dark:bg-space-800 rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 dark:border-space-700 mb-6 text-nature-600 dark:text-space-accent group-hover:bg-nature-600 dark:group-hover:bg-space-accent group-hover:text-white dark:group-hover:text-space-950 transition-colors">
                    <Book className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-slate-100 group-hover:text-nature-700 dark:group-hover:text-space-accent transition-colors mb-2">{c.name}</h3>
                <p className="text-stone-500 dark:text-slate-400 font-medium">Semester {c.semester}</p>
                <div className="mt-6 flex items-center text-sm text-stone-400 dark:text-slate-500 font-bold">
                <Users className="w-4 h-4 mr-2" />
                <span>{c.students.length} Students Enrolled</span>
                </div>
                {user?.role === UserRole.TEACHER && (
                    <div className="mt-6 pt-4 border-t border-stone-100 dark:border-space-800 text-[10px] text-stone-400 dark:text-slate-600 font-mono tracking-widest uppercase">
                        Code: {c.id}
                    </div>
                )}
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400 dark:text-slate-600 bg-white/50 dark:bg-space-900/30 rounded-[2rem] border-2 border-dashed border-stone-200 dark:border-space-800">
            <div className="w-16 h-16 bg-stone-100 dark:bg-space-800 rounded-full flex items-center justify-center mb-4">
                <Book className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-serif italic text-lg">No classrooms found.</p>
            <p className="text-sm mt-2">{user?.role === UserRole.TEACHER ? "Plant a seed by creating a class." : "Join a class to start growing."}</p>
          </div>
        )}
      </div>

      {/* Modals - Themed */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-space-900 p-8 rounded-[2rem] w-full max-w-md shadow-2xl dark:border dark:border-space-800">
            <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-white mb-6">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <input type="text" placeholder="Class Name" className="w-full p-3.5 bg-paper dark:bg-space-950 border border-stone-200 dark:border-space-800 rounded-xl focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none dark:text-white" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
              <input type="text" placeholder="Semester" className="w-full p-3.5 bg-paper dark:bg-space-950 border border-stone-200 dark:border-space-800 rounded-xl focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none dark:text-white" value={newClassSem} onChange={e => setNewClassSem(e.target.value)} />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 text-stone-500 dark:text-slate-400 font-bold hover:text-stone-800 dark:hover:text-white">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-nature-700 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-nature-800 dark:hover:bg-indigo-700 shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/20">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-stone-900/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-space-900 p-8 rounded-[2rem] w-full max-w-md shadow-2xl dark:border dark:border-space-800">
            <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-white mb-6">Join Class</h3>
            <form onSubmit={handleJoinClass} className="space-y-4">
              <input type="text" placeholder="Enter Class ID" className="w-full p-3.5 bg-paper dark:bg-space-950 border border-stone-200 dark:border-space-800 rounded-xl focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none uppercase font-mono tracking-widest text-center text-lg dark:text-white" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-6 py-3 text-stone-500 dark:text-slate-400 font-bold hover:text-stone-800 dark:hover:text-white">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-nature-700 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-nature-800 dark:hover:bg-indigo-700 shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/20">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  return (
    <Layout>
      {user ? <Dashboard /> : <Auth />}
    </Layout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </ThemeProvider>
  );
}