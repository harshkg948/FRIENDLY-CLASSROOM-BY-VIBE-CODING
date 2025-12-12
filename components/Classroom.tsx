import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Classroom, UserRole, AttendanceSession, Assignment, Question, Submission, AttendanceRecord, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService, assignmentService, userService, classroomService } from '../services/mockDatabase';
import { Clock, MapPin, Users, BookOpen, Search, Plus, CheckCircle, XCircle, AlertTriangle, FileText, Send, Award, Trash2, Radio, Zap, Calendar, ChevronDown, ChevronUp, Filter, RefreshCw, Leaf, Bell, Settings, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

interface ClassroomProps {
  classroom: Classroom;
  onBack: () => void;
}

export const ClassroomView: React.FC<ClassroomProps> = ({ classroom: initialClassroom, onBack }) => {
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(initialClassroom);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'history' | 'assignments' | 'ai'>('overview');
  const [session, setSession] = useState<AttendanceSession | undefined>(undefined);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Stats
  const [attendanceRate, setAttendanceRate] = useState(0);

  // Reminder State
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // Refresh classroom data to get latest settings
    const fresh = classroomService.get(initialClassroom.id);
    if(fresh) setClassroom(fresh);
  }, [activeTab]);

  // Poll for active session and Reminder check
  useEffect(() => {
    const interval = setInterval(() => {
      const s = attendanceService.getActiveSession(classroom.id);
      setSession(s); 
      if (s) {
        const left = Math.max(0, Math.ceil((s.endTime - Date.now()) / 1000));
        setTimeRemaining(left);
      } else {
        setTimeRemaining(0);
      }

      // Check Reminder (Within 1 hour)
      if (classroom.nextClassTime) {
          const diff = classroom.nextClassTime - Date.now();
          // If less than 60 mins and future
          if (diff > 0 && diff <= 60 * 60 * 1000) {
              setShowReminder(true);
          } else {
              setShowReminder(false);
          }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [classroom.id, classroom.nextClassTime]);

  // Calculate stats
  useEffect(() => {
      if (user?.role === UserRole.STUDENT) {
          const sessions = attendanceService.getSessions(classroom.id);
          if (sessions.length === 0) {
              setAttendanceRate(100);
              return;
          }
          let present = 0;
          sessions.forEach(s => {
             const r = attendanceService.getRecordForStudent(s.id, user.id);
             if (r && r.status === 'PRESENT') present++;
          });
          setAttendanceRate(Math.round((present / sessions.length) * 100));
      }
  }, [classroom.id, user, activeTab]);

  const handleUpdateClass = (key: keyof Classroom, value: any) => {
      classroomService.update(classroom.id, { [key]: value });
      setClassroom({ ...classroom, [key]: value });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes pop-in { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .animate-pop-in { animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-nature-900 dark:bg-black text-white shadow-2xl shadow-nature-900/20 dark:shadow-indigo-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-nature-800 via-nature-700 to-emerald-900 dark:from-space-900 dark:via-space-950 dark:to-indigo-950 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        
        <div className="relative z-10 p-8 sm:p-12">
            <button onClick={onBack} className="text-nature-200 dark:text-space-accent hover:text-white transition-colors text-sm font-bold mb-8 flex items-center gap-2">
                &larr; Back to Dashboard
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-2 text-white">{classroom.name}</h1>
                    <p className="text-xl text-nature-100 dark:text-slate-300 font-light flex items-center gap-2">
                         <span className="opacity-75">{classroom.semester} Semester</span>
                         <span className="w-1.5 h-1.5 bg-nature-300 dark:bg-space-accent rounded-full"></span>
                         <span className="opacity-75">{classroom.teacherName}</span>
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-nature-200 dark:text-space-accent uppercase tracking-widest font-bold mb-1">Class Code</p>
                    <p className="text-2xl font-mono tracking-wider select-all text-white">{classroom.id}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Reminder Banner */}
      {showReminder && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center gap-4 animate-pulse shadow-sm">
            <div className="bg-amber-200 dark:bg-amber-800 p-2 rounded-full">
                <Bell className="w-6 h-6 text-amber-700 dark:text-amber-200" />
            </div>
            <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-100">Upcoming Class</h4>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                    Class starts in {Math.ceil((classroom.nextClassTime! - Date.now()) / 60000)} minutes. Get ready!
                </p>
            </div>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-space-900/80 rounded-2xl w-fit shadow-sm border border-stone-200/60 dark:border-space-800 mx-auto sm:mx-0">
        {[
            { id: 'overview', icon: BookOpen, label: 'Overview' },
            { id: 'attendance', icon: Users, label: 'Attendance', alert: !!session },
            { id: 'history', icon: Calendar, label: 'History' },
            { id: 'assignments', icon: FileText, label: 'Assignments' },
            { id: 'ai', icon: Search, label: 'AI Studio' },
        ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                    relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2
                    ${activeTab === tab.id 
                        ? 'bg-nature-700 dark:bg-indigo-600 text-white shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/30' 
                        : 'text-stone-500 dark:text-slate-400 hover:bg-nature-50 dark:hover:bg-space-800 hover:text-nature-800 dark:hover:text-white'}
                `}
            >
                <tab.icon className={`w-4 h-4 ${tab.alert ? 'animate-pulse text-amber-400' : ''}`} />
                {tab.label}
                {tab.alert && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-bounce border-2 border-white dark:border-space-900" />
                )}
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/80 dark:bg-space-900/60 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-stone-100 dark:border-space-800">
                        <h3 className="text-2xl font-serif font-bold text-stone-800 dark:text-white mb-6 flex items-center gap-3">
                            <span className="p-2 bg-nature-100 dark:bg-space-800 text-nature-700 dark:text-space-accent rounded-lg"><Clock className="w-5 h-5" /></span>
                            Weekly Schedule
                        </h3>
                        <div className="prose prose-stone dark:prose-invert max-w-none bg-paper dark:bg-space-950 p-8 rounded-3xl border border-stone-200/60 dark:border-space-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-nature-50 dark:bg-indigo-900/20 rounded-bl-[4rem] -z-0"></div>
                            <pre className="font-sans whitespace-pre-wrap text-stone-600 dark:text-slate-300 relative z-10 leading-relaxed">{classroom.schedule}</pre>
                        </div>
                    </div>

                    {/* Teacher Settings */}
                    {user?.role === UserRole.TEACHER && (
                        <div className="bg-white dark:bg-space-900/60 rounded-[2rem] p-8 shadow-sm border border-stone-100 dark:border-space-800">
                             <h4 className="font-bold font-serif text-xl text-stone-800 dark:text-white mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-stone-400" /> Class Configuration
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Next Class Time</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full p-3 rounded-xl border border-stone-200 dark:border-space-700 bg-paper dark:bg-space-950 dark:text-white focus:ring-2 focus:ring-nature-500 dark:focus:ring-space-accent outline-none transition-all"
                                        onChange={(e) => handleUpdateClass('nextClassTime', new Date(e.target.value).getTime())}
                                    />
                                    <p className="text-[10px] text-stone-400">Sets a reminder for students 1 hour before.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Attendance Criteria (%)</label>
                                    <input 
                                        type="number" 
                                        placeholder="75"
                                        defaultValue={classroom.attendanceThreshold || 75}
                                        className="w-full p-3 rounded-xl border border-stone-200 dark:border-space-700 bg-paper dark:bg-space-950 dark:text-white focus:ring-2 focus:ring-nature-500 dark:focus:ring-space-accent outline-none transition-all"
                                        onBlur={(e) => handleUpdateClass('attendanceThreshold', parseInt(e.target.value))}
                                    />
                                    <p className="text-[10px] text-stone-400">Minimum percentage required for students.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-b from-nature-50 to-white dark:from-space-900 dark:to-space-950 rounded-[2rem] p-8 shadow-sm border border-nature-100 dark:border-space-800 h-fit">
                    <h3 className="text-xl font-serif font-bold text-nature-900 dark:text-white mb-6">Class Stats</h3>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-space-800 p-5 rounded-2xl shadow-sm border border-nature-50 dark:border-space-700 flex items-center justify-between">
                            <span className="text-stone-500 dark:text-slate-400 text-sm font-bold">Students Enrolled</span>
                            <span className="text-3xl font-serif font-bold text-stone-800 dark:text-white">{classroom.students.length}</span>
                        </div>
                        {user?.role === UserRole.STUDENT && (
                           <>
                                <div className={`p-5 rounded-2xl border ${attendanceRate < (classroom.attendanceThreshold || 75) ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800'}`}>
                                    <span className="text-sm font-bold opacity-70 text-stone-600 dark:text-slate-300">Attendance Health</span>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className={`text-4xl font-serif font-bold ${attendanceRate < (classroom.attendanceThreshold || 75) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {attendanceRate}%
                                        </span>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-60 block">Target</span>
                                            <span className="font-bold text-stone-700 dark:text-white">{classroom.attendanceThreshold || 75}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${attendanceRate < (classroom.attendanceThreshold || 75) ? 'bg-red-500' : 'bg-green-500'}`} 
                                            style={{ width: `${Math.min(100, attendanceRate)}%` }} 
                                        />
                                    </div>
                                    {attendanceRate < (classroom.attendanceThreshold || 75) && <p className="text-xs mt-3 font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Warning: Below Criteria!</p>}
                                </div>
                           </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'attendance' && (
            <AttendanceModule 
                classroom={classroom} 
                session={session} 
                timeRemaining={timeRemaining} 
            />
        )}
        
        {activeTab === 'history' && (
            <HistoryModule classroom={classroom} />
        )}

        {activeTab === 'assignments' && (
            <AssignmentsModule classroom={classroom} />
        )}

        {activeTab === 'ai' && (
            <AIAssistant />
        )}
      </div>
    </div>
  );
};

// --- Attendance Module ---
const AttendanceModule: React.FC<{ 
    classroom: Classroom; 
    session?: AttendanceSession; 
    timeRemaining: number 
}> = ({ classroom, session, timeRemaining }) => {
    // ... [Attendance Module Logic Unchanged] ...
    const { user } = useAuth();
    const [status, setStatus] = useState<AttendanceRecord['status'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if (session && user) {
            const fetchFn = () => {
                const records = attendanceService.getRecords(session.id);
                if (user.role === UserRole.TEACHER) {
                    setLiveRecords(records);
                } else {
                    const myRecord = records.find(r => r.studentId === user.id);
                    if (myRecord) {
                        setStatus(myRecord.status);
                        if (myRecord.locationDifference) setDistance(myRecord.locationDifference);
                    }
                }
            };
            
            fetchFn();
            const interval = setInterval(fetchFn, 2000);
            return () => clearInterval(interval);
        } else {
            setStatus(null);
            setLiveRecords([]);
            setDistance(null);
        }
    }, [session?.id, user]);

    const handleStartSession = () => {
        if (!navigator.geolocation) return alert("Geolocation required");
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                attendanceService.startSession(classroom.id, {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                setLoading(false);
            },
            () => { setLoading(false); alert("Failed to get location"); }
        );
    };

    const handleMarkAttendance = () => {
        if (!session || !navigator.geolocation) return;
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const R = 6371e3;
                const lat1 = session.teacherLocation?.lat || 0;
                const lat2 = pos.coords.latitude;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (pos.coords.longitude - (session.teacherLocation?.lng || 0)) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c; 

                setDistance(Math.round(d));
                const attStatus = d > 50 ? 'BUNK' : 'PRESENT';

                const record: AttendanceRecord = {
                    id: Date.now().toString(),
                    sessionId: session.id,
                    studentId: user!.id,
                    studentName: user!.name,
                    timestamp: Date.now(),
                    status: attStatus,
                    locationDifference: d
                };
                
                attendanceService.markAttendance(record);
                setStatus(attStatus);
                setLoading(false);
            },
            () => {
                setLoading(false);
                alert("Location access needed to mark attendance.");
            },
            { enableHighAccuracy: true }
        );
    };

    const totalTime = 60;
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (timeRemaining / totalTime) * circumference;
    const progressColor = timeRemaining < 10 ? 'stroke-red-500' : timeRemaining < 30 ? 'stroke-amber-500' : 'stroke-nature-500 dark:stroke-space-accent';

    if (user?.role === UserRole.TEACHER) {
        const presentCount = liveRecords.filter(r => r.status === 'PRESENT').length;
        
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-space-900/60 rounded-[2rem] shadow-sm border border-stone-100 dark:border-space-800 min-h-[400px]">
                {session ? (
                    <div className="w-full max-w-md space-y-8 animate-fade-in px-4">
                        <div className="text-center">
                             <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-nature-50 dark:bg-space-800 animate-pulse-ring"></div>
                                <svg className="w-full h-full transform -rotate-90 relative z-10">
                                    <circle cx="128" cy="128" r={radius} className="stroke-stone-100 dark:stroke-space-800 fill-white dark:fill-space-900" strokeWidth="12" />
                                    <circle cx="128" cy="128" r={radius} className={`fill-none transition-all duration-1000 ease-linear ${progressColor}`} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                    <span className="text-6xl font-black text-stone-800 dark:text-white tabular-nums tracking-tighter font-serif">{timeRemaining}</span>
                                    <span className="text-xs text-stone-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Seconds</span>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="text-2xl font-serif font-bold text-stone-800 dark:text-white">Session Active</h3>
                                <div className="flex items-center justify-center gap-2 text-nature-600 dark:text-space-accent mt-2">
                                    <Zap className="w-4 h-4 animate-bounce" />
                                    <span className="font-medium text-sm">Broadcasting Location</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-paper dark:bg-space-950 rounded-2xl p-5 border border-stone-200 dark:border-space-800 shadow-inner">
                             <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-space-900 text-nature-600 dark:text-space-accent rounded-lg shadow-sm border border-stone-100 dark:border-space-700">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-700 dark:text-slate-300">Live Check-ins</p>
                                        <p className="text-[10px] text-stone-400 dark:text-slate-500 uppercase tracking-wider font-bold">Updates instantly</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-2xl font-black text-stone-800 dark:text-white font-serif">{presentCount}</span>
                                    <span className="text-sm text-stone-400 dark:text-slate-500 font-medium font-serif"> / {classroom.students.length}</span>
                                 </div>
                             </div>

                             {liveRecords.length > 0 ? (
                                 <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {liveRecords.map(record => (
                                        <div key={record.id} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-space-900 rounded-xl border border-stone-100 dark:border-space-800 shadow-sm animate-pop-in">
                                            <span className="font-bold text-stone-700 dark:text-slate-200 truncate">{record.studentName}</span>
                                            {record.status === 'PRESENT' ? (
                                                <span className="text-nature-700 dark:text-space-accent font-bold text-xs bg-nature-100 dark:bg-space-800 px-2 py-1 rounded-md border border-nature-200 dark:border-space-700">Present</span>
                                            ) : (
                                                <span className="text-red-700 font-bold text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/50">Bunk ({Math.round(record.locationDifference || 0)}m)</span>
                                            )}
                                        </div>
                                    ))}
                                 </div>
                             ) : (
                                 <div className="text-center text-stone-400 dark:text-slate-600 text-sm py-4 italic font-serif">
                                     Waiting for students to arrive...
                                 </div>
                             )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 animate-fade-in max-w-md px-4">
                        <div className="w-32 h-32 bg-nature-50 dark:bg-space-800 rounded-full flex items-center justify-center mx-auto text-nature-600 dark:text-space-accent mb-4 border-4 border-white dark:border-space-700 shadow-xl shadow-nature-100 dark:shadow-space-900/50">
                            <MapPin className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-bold font-serif text-stone-800 dark:text-white">Start Attendance</h3>
                        <p className="text-stone-500 dark:text-slate-400 leading-relaxed text-sm">
                            Create a secure 60-second window. We'll use your current GPS location as the geofence anchor.
                        </p>
                        <button 
                            onClick={handleStartSession}
                            disabled={loading}
                            className="bg-nature-800 dark:bg-indigo-600 hover:bg-nature-900 dark:hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-nature-900/20 dark:shadow-indigo-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 mx-auto w-full justify-center"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Acquiring GPS...
                                </>
                            ) : (
                                <>
                                    <Radio className="w-5 h-5" />
                                    Broadcast Signal
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        );
    }
    // ... [Attendance Student View - Unchanged] ...
    return (
        <div className="bg-white dark:bg-space-900/60 rounded-[2rem] p-8 shadow-sm border border-stone-100 dark:border-space-800 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {session ? (
                status ? (
                    <div className="text-center space-y-6 animate-pop-in relative z-10">
                        {status === 'PRESENT' ? (
                            <>
                                <div className="w-24 h-24 bg-nature-100 dark:bg-space-800 text-nature-600 dark:text-space-accent rounded-full flex items-center justify-center mx-auto shadow-lg shadow-nature-100 dark:shadow-indigo-500/20 border-4 border-white dark:border-space-700">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold font-serif text-stone-800 dark:text-white mb-2">Checked In!</h2>
                                    <p className="text-stone-500 dark:text-slate-400">You're marked present for this session.</p>
                                </div>
                                <div className="inline-block bg-nature-50 dark:bg-space-950 text-nature-700 dark:text-space-accent px-4 py-2 rounded-xl font-mono text-sm border border-nature-200 dark:border-space-800 font-bold">
                                    Distance: {Math.round(distance || 0)}m
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-50 border-4 border-white dark:border-space-700 animate-shake">
                                    <AlertTriangle className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold font-serif text-red-600 mb-2">Location Mismatch</h2>
                                    <p className="text-stone-600 dark:text-slate-400 max-w-xs mx-auto text-sm">
                                        You are too far from the classroom to be marked present.
                                    </p>
                                </div>
                                <div className="inline-block bg-red-50 dark:bg-red-900/20 text-red-700 px-4 py-2 rounded-xl font-mono text-sm border border-red-200 dark:border-red-900/50 font-bold">
                                    Distance: {Math.round(distance || 0)}m (Max 50m)
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center w-full max-w-md relative z-10">
                        <div className="mb-8">
                             <span className="inline-flex items-center gap-2 bg-amber-50 dark:bg-space-950 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold animate-pulse border border-amber-100 dark:border-space-800">
                                <Clock className="w-4 h-4" /> Closing in {timeRemaining}s
                             </span>
                        </div>
                        
                        <button 
                            onClick={handleMarkAttendance}
                            disabled={loading}
                            className="w-full aspect-square max-w-[280px] mx-auto bg-gradient-to-br from-nature-600 to-emerald-600 dark:from-indigo-600 dark:to-purple-600 rounded-full shadow-2xl shadow-nature-600/40 dark:shadow-indigo-600/40 flex flex-col items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 relative group overflow-hidden border-8 border-white/20 dark:border-space-800/50"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                            {loading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="font-medium text-nature-100 dark:text-indigo-100">Verifying GPS...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20"></div>
                                    <MapPin className="w-16 h-16 mb-2 group-hover:animate-bounce relative z-10" />
                                    <span className="text-3xl font-black tracking-tight relative z-10 font-serif">TAP TO MARK</span>
                                    <span className="text-nature-200 dark:text-indigo-200 font-medium mt-1 relative z-10 text-sm uppercase tracking-widest">I am here</span>
                                </>
                            )}
                        </button>

                        <div className="mt-8">
                            <div className="h-2 w-full bg-stone-100 dark:bg-space-950 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-linear ${timeRemaining < 10 ? 'bg-red-500' : 'bg-nature-500 dark:bg-space-accent'}`}
                                    style={{ width: `${(timeRemaining / totalTime) * 100}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-stone-400 dark:text-slate-500 font-bold flex justify-between uppercase tracking-wider">
                                <span>Time Remaining</span>
                                <span>{Math.round((timeRemaining / totalTime) * 100)}%</span>
                            </p>
                        </div>
                    </div>
                )
            ) : (
                <div className="text-center text-stone-300 dark:text-space-800">
                    <div className="w-24 h-24 bg-paper dark:bg-space-950 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-stone-200 dark:border-space-800">
                        <Leaf className="w-10 h-10 opacity-50 dark:text-space-700" />
                    </div>
                    <p className="text-lg font-medium text-stone-400 dark:text-slate-600 font-serif italic">Waiting for teacher to start session...</p>
                </div>
            )}
        </div>
    );
};

// --- History Module ---
const HistoryModule: React.FC<{ classroom: Classroom }> = ({ classroom }) => {
    // ... [History Module Unchanged] ...
    const { user } = useAuth();
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [studentUsers, setStudentUsers] = useState<User[]>([]);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const s = attendanceService.getSessions(classroom.id);
        setSessions(s);
        const users = userService.getUsersByIds(classroom.students);
        setStudentUsers(users);
    }, [classroom.id]);

    const toggleSession = (sessionId: string) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
        } else {
            setExpandedSession(sessionId);
            setRecords(attendanceService.getRecords(sessionId));
        }
    };

    const filteredSessions = sessions.filter(s => {
        if (!filterDate) return true;
        const sDate = new Date(s.startTime).toISOString().split('T')[0];
        return sDate === filterDate;
    });

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-space-900/60 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-space-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-white flex items-center gap-2">
                    <Calendar className="text-nature-600 dark:text-space-accent" /> Session History
                </h3>
                <div className="flex items-center gap-2 bg-paper dark:bg-space-950 px-4 py-2 rounded-xl border border-stone-200 dark:border-space-800">
                    <Filter className="w-4 h-4 text-stone-500 dark:text-slate-500" />
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={e => setFilterDate(e.target.value)}
                        className="bg-transparent text-sm text-stone-700 dark:text-slate-300 outline-none font-sans dark:[color-scheme:dark]"
                    />
                    {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-red-500 font-bold ml-2">Clear</button>}
                </div>
            </div>

            <div className="space-y-4">
                {filteredSessions.map(session => {
                    const myRecord = user?.role === UserRole.STUDENT 
                        ? attendanceService.getRecordForStudent(session.id, user.id)
                        : null;
                    const date = new Date(session.startTime);
                    const sessionRecs = attendanceService.getRecords(session.id);
                    const presentCount = sessionRecs.filter(r => r.status === 'PRESENT').length;

                    return (
                        <div key={session.id} className="bg-white dark:bg-space-900 rounded-2xl border border-stone-100 dark:border-space-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md group">
                            <div 
                                onClick={() => user?.role === UserRole.TEACHER && toggleSession(session.id)}
                                className={`p-6 flex items-center justify-between cursor-pointer ${expandedSession === session.id ? 'bg-paper dark:bg-space-950' : 'bg-white dark:bg-space-900'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className="bg-nature-50 dark:bg-space-800 text-nature-800 dark:text-white p-4 rounded-xl font-serif font-bold text-center min-w-[70px] border border-nature-100 dark:border-space-700">
                                        <div className="text-xs uppercase tracking-widest text-nature-500 dark:text-space-accent">{date.toLocaleString('default', { month: 'short' })}</div>
                                        <div className="text-2xl">{date.getDate()}</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-stone-800 dark:text-white font-serif text-lg group-hover:text-nature-700 dark:group-hover:text-space-accent transition-colors">Lecture Session</h4>
                                        <p className="text-sm text-stone-500 dark:text-slate-400 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {user?.role === UserRole.TEACHER ? (
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-lg font-bold text-stone-700 dark:text-slate-200 font-serif">{presentCount} <span className="text-stone-300 dark:text-space-700 text-sm">/</span> {classroom.students.length}</div>
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 dark:text-slate-500">Attended</div>
                                        </div>
                                        <div className={`p-2 rounded-full transition-colors ${expandedSession === session.id ? 'bg-nature-100 dark:bg-space-800 text-nature-700 dark:text-space-accent' : 'bg-stone-50 dark:bg-space-950 text-stone-400 dark:text-slate-500'}`}>
                                            {expandedSession === session.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {myRecord ? (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${myRecord.status === 'PRESENT' ? 'bg-nature-100 dark:bg-space-800 text-nature-800 dark:text-space-accent border border-nature-200 dark:border-space-700' : 'bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-100 dark:border-red-900/50'}`}>
                                                {myRecord.status}
                                            </span>
                                        ) : (
                                            <span className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-stone-100 dark:bg-space-950 text-stone-500 dark:text-slate-500 border border-stone-200 dark:border-space-800">
                                                ABSENT
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {user?.role === UserRole.TEACHER && expandedSession === session.id && (
                                <div className="border-t border-stone-100 dark:border-space-800 p-6 bg-paper/50 dark:bg-space-950/50 animate-fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {studentUsers.map(student => {
                                            const rec = records.find(r => r.studentId === student.id);
                                            const status = rec ? rec.status : 'ABSENT';
                                            
                                            return (
                                                <div key={student.id} className="bg-white dark:bg-space-900 p-3.5 rounded-xl border border-stone-100 dark:border-space-800 flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <div className="font-bold text-sm text-stone-800 dark:text-white">{student.name}</div>
                                                        <div className="text-xs text-stone-400 dark:text-slate-500">{student.email}</div>
                                                    </div>
                                                    {status === 'PRESENT' && <CheckCircle className="w-5 h-5 text-nature-500 dark:text-space-accent" />}
                                                    {status === 'BUNK' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                                    {status === 'ABSENT' && <XCircle className="w-5 h-5 text-stone-300 dark:text-space-800" />}
                                                </div>
                                            );
                                        })}
                                        {studentUsers.length === 0 && <div className="col-span-full text-center text-stone-400 dark:text-slate-600 text-sm italic">No students enrolled.</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredSessions.length === 0 && (
                    <div className="text-center py-12 text-stone-400 dark:text-slate-600 bg-white dark:bg-space-900/60 rounded-[2rem] border-2 border-dashed border-stone-200 dark:border-space-800">
                        <Leaf className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="font-serif italic">No session history found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- TakeAssignment Component ---
const TakeAssignment: React.FC<{ assignment: Assignment; onBack: () => void }> = ({ assignment, onBack }) => {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState<Submission | undefined>(undefined);

    useEffect(() => {
        if (user) {
            const sub = assignmentService.getMySubmission(assignment.id, user.id);
            setExistingSubmission(sub);
            if (sub) setAnswers(sub.answers);
        }
    }, [assignment.id, user]);

    const handleSubmit = () => {
        if (!user) return;
        setSubmitting(true);
        const submission: Submission = {
            id: existingSubmission?.id || Date.now().toString(),
            assignmentId: assignment.id,
            studentId: user.id,
            studentName: user.name,
            answers,
            submittedAt: Date.now(),
            status: 'PENDING'
        };
        
        // Simulate network delay
        setTimeout(() => {
            assignmentService.submit(submission);
            setSubmitting(false);
            onBack();
        }, 1000);
    };

    const isGraded = existingSubmission?.status === 'GRADED';

    return (
        <div className="bg-white dark:bg-space-900 rounded-[2rem] p-8 shadow-sm border border-stone-100 dark:border-space-800 max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8 border-b border-stone-100 dark:border-space-800 pb-6">
                 <button onClick={onBack} className="text-stone-400 hover:text-stone-800 dark:hover:text-white transition-colors">
                    &larr; Back
                 </button>
                 <h2 className="text-2xl font-bold font-serif text-stone-800 dark:text-white flex-1">{assignment.title}</h2>
                 {isGraded && (
                     <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-bold border border-green-200 dark:border-green-800">
                         Graded: {existingSubmission.grade}/{assignment.totalPoints}
                     </span>
                 )}
            </div>
            
            <p className="text-stone-500 dark:text-slate-400 mb-8 leading-relaxed whitespace-pre-wrap">{assignment.description}</p>

            <div className="space-y-8">
                {assignment.questions.map((q, idx) => (
                    <div key={q.id} className="p-6 bg-paper dark:bg-space-950 rounded-2xl border border-stone-200 dark:border-space-800">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-stone-800 dark:text-white text-lg flex gap-2">
                                <span className="text-stone-300 dark:text-space-700">0{idx + 1}.</span> 
                                {q.text}
                            </h4>
                            <span className="text-xs font-bold text-stone-400 dark:text-slate-500 bg-white dark:bg-space-900 px-2 py-1 rounded border border-stone-100 dark:border-space-800">{q.points} pts</span>
                        </div>

                        {q.type === 'MCQ' ? (
                            <div className="space-y-3">
                                {q.options?.map((opt, oIdx) => (
                                    <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${answers[q.id] === opt ? 'bg-nature-50 dark:bg-space-800 border-nature-200 dark:border-space-600 shadow-sm' : 'bg-white dark:bg-space-900 border-stone-200 dark:border-space-800 hover:border-stone-300 dark:hover:border-space-700'}`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[q.id] === opt ? 'border-nature-500 dark:border-space-accent' : 'border-stone-300 dark:border-space-700'}`}>
                                            {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-nature-500 dark:bg-space-accent" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name={q.id} 
                                            value={opt} 
                                            checked={answers[q.id] === opt} 
                                            onChange={() => !isGraded && setAnswers({ ...answers, [q.id]: opt })}
                                            className="hidden"
                                            disabled={isGraded}
                                        />
                                        <span className="text-stone-700 dark:text-slate-300">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea 
                                className="w-full p-4 rounded-xl border border-stone-200 dark:border-space-800 bg-white dark:bg-space-900 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition text-stone-700 dark:text-white"
                                rows={3}
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ''}
                                onChange={(e) => !isGraded && setAnswers({ ...answers, [q.id]: e.target.value })}
                                disabled={isGraded}
                            />
                        )}
                    </div>
                ))}
            </div>
            
            {existingSubmission?.feedback && (
                <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Teacher Feedback
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm italic">"{existingSubmission.feedback}"</p>
                </div>
            )}

            {!isGraded && (
                <div className="mt-8 pt-8 border-t border-stone-100 dark:border-space-800 flex justify-end">
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="bg-nature-700 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/20 hover:bg-nature-800 dark:hover:bg-indigo-700 transition transform active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {submitting ? 'Submitting...' : (existingSubmission ? 'Update Submission' : 'Submit Assignment')}
                        {!submitting && <Send className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- SubmissionsView Component ---
const SubmissionsView: React.FC<{ assignment: Assignment; onBack: () => void }> = ({ assignment, onBack }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        setSubmissions(assignmentService.getSubmissions(assignment.id));
    }, [assignment.id]);

    const handleSelect = (sub: Submission) => {
        setSelectedSubmission(sub);
        setGrade(sub.grade || 0);
        setFeedback(sub.feedback || '');
    };

    const handleSaveGrade = () => {
        if (!selectedSubmission) return;
        assignmentService.grade(selectedSubmission.id, grade, feedback);
        setSubmissions(assignmentService.getSubmissions(assignment.id));
        setSelectedSubmission(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[calc(100vh-200px)]">
            {/* List of Submissions */}
            <div className="lg:col-span-1 bg-white dark:bg-space-900 rounded-[2rem] p-6 shadow-sm border border-stone-100 dark:border-space-800 flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100 dark:border-space-800">
                    <button onClick={onBack} className="text-stone-400 hover:text-stone-800 dark:hover:text-white transition-colors">
                        &larr;
                    </button>
                    <h3 className="font-bold font-serif text-stone-800 dark:text-white">Submissions</h3>
                    <span className="ml-auto text-xs font-bold bg-stone-100 dark:bg-space-800 px-2 py-1 rounded text-stone-500 dark:text-slate-400">{submissions.length}</span>
                </div>
                
                <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                    {submissions.length === 0 && <p className="text-center text-stone-400 dark:text-slate-600 text-sm italic mt-10">No submissions yet.</p>}
                    {submissions.map(sub => (
                        <div 
                            key={sub.id} 
                            onClick={() => handleSelect(sub)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedSubmission?.id === sub.id ? 'bg-nature-50 dark:bg-space-800 border-nature-200 dark:border-space-600 ring-1 ring-nature-200 dark:ring-space-600' : 'bg-paper dark:bg-space-950 border-stone-200 dark:border-space-800 hover:border-nature-300 dark:hover:border-space-700'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-stone-700 dark:text-white">{sub.studentName}</span>
                                {sub.status === 'GRADED' ? (
                                    <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{sub.grade}/{assignment.totalPoints}</span>
                                ) : (
                                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Pending</span>
                                )}
                            </div>
                            <span className="text-xs text-stone-400 dark:text-slate-500">{new Date(sub.submittedAt).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grading Pane */}
            <div className="lg:col-span-2 bg-white dark:bg-space-900 rounded-[2rem] p-8 shadow-sm border border-stone-100 dark:border-space-800 h-full overflow-y-auto custom-scrollbar flex flex-col relative">
                {selectedSubmission ? (
                    <>
                        <div className="mb-6 flex justify-between items-center">
                             <div>
                                <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-white">{selectedSubmission.studentName}'s Work</h3>
                                <p className="text-sm text-stone-400 dark:text-slate-500">Submitted on {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                             </div>
                             <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={grade} 
                                    onChange={e => setGrade(Number(e.target.value))}
                                    className="w-20 p-2 text-center text-xl font-bold rounded-lg border-2 border-nature-200 dark:border-space-700 bg-white dark:bg-space-950 dark:text-white focus:border-nature-500 dark:focus:border-space-accent outline-none"
                                />
                                <span className="self-end text-lg font-bold text-stone-400 dark:text-slate-500 mb-2">/ {assignment.totalPoints}</span>
                             </div>
                        </div>

                        <div className="space-y-6 mb-24">
                            {assignment.questions.map((q, idx) => (
                                <div key={q.id} className="p-5 bg-paper dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800">
                                    <div className="flex justify-between mb-2">
                                        <h4 className="font-bold text-stone-700 dark:text-slate-200 text-sm">Q{idx+1}. {q.text}</h4>
                                        <span className="text-xs font-bold text-stone-400 dark:text-slate-500">{q.points} pts</span>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-space-900 rounded-lg border border-stone-100 dark:border-space-800 text-stone-800 dark:text-white mb-2">
                                        {selectedSubmission.answers[q.id] || <span className="text-stone-300 dark:text-space-700 italic">No answer</span>}
                                    </div>
                                    {q.type === 'MCQ' && q.correctAnswer && (
                                        <div className="text-xs text-stone-500 dark:text-slate-500 flex items-center gap-1">
                                            {selectedSubmission.answers[q.id] === q.correctAnswer ? (
                                                <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Correct</span>
                                            ) : (
                                                 <span className="text-red-500 font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Incorrect (Ans: {q.correctAnswer})</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-space-900/90 backdrop-blur-md border-t border-stone-100 dark:border-space-800 rounded-b-[2rem]">
                            <div className="flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Add feedback..." 
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    className="flex-1 p-3 bg-paper dark:bg-space-950 border border-stone-200 dark:border-space-800 rounded-xl focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 outline-none dark:text-white"
                                />
                                <button 
                                    onClick={handleSaveGrade}
                                    className="bg-nature-700 dark:bg-indigo-600 text-white px-6 rounded-xl font-bold shadow-lg hover:bg-nature-800 dark:hover:bg-indigo-700 transition"
                                >
                                    Grade & Save
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-stone-300 dark:text-slate-700">
                        <Award className="w-16 h-16 mb-4 opacity-50" />
                        <p className="font-serif italic text-lg">Select a submission to grade.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Assignments Module ---
const AssignmentsModule: React.FC<{ classroom: Classroom }> = ({ classroom }) => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [view, setView] = useState<'LIST' | 'CREATE' | 'TAKE' | 'STATS' | 'SUBMISSIONS'>('LIST');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    
    // Filtering and Sorting State for Teachers
    const [sortConfig, setSortConfig] = useState<{ key: 'dueDate' | 'title', direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');

    useEffect(() => {
        const fetchAssignments = () => {
            setAssignments(assignmentService.list(classroom.id));
        };
        
        fetchAssignments();
        
        // Poll only in LIST view to avoid unnecessary updates/re-renders during creation/taking
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (view === 'LIST') {
             intervalId = setInterval(fetchAssignments, 3000);
        }
        
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [classroom.id, view]);

    // Teacher: Create Assignment State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newQuestions, setNewQuestions] = useState<Question[]>([]);
    
    // Teacher: Create Helpers
    const addQuestion = (type: 'MCQ' | 'SHORT_ANSWER') => {
        setNewQuestions([
            ...newQuestions, 
            { 
                id: Date.now().toString(), 
                type, 
                text: '', 
                points: 1, 
                options: type === 'MCQ' ? ['', ''] : undefined 
            }
        ]);
    };

    const handleCreate = () => {
        if (!newTitle) return alert("Title required");
        const totalPoints = newQuestions.reduce((sum, q) => sum + q.points, 0);
        assignmentService.create({
            id: Date.now().toString(),
            classroomId: classroom.id,
            title: newTitle,
            description: newDesc,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            questions: newQuestions,
            totalPoints
        });
        setView('LIST');
        setNewTitle(''); setNewDesc(''); setNewQuestions([]);
    };
    
    // Derived state for sorting and filtering
    const processedAssignments = useMemo(() => {
        let processed = assignments.map(a => {
             // Derive grading status
             const subs = assignmentService.getSubmissions(a.id);
             let derivedStatus = 'OPEN';
             
             if (user?.role === UserRole.TEACHER) {
                 const pending = subs.filter(s => s.status === 'PENDING').length;
                 if (pending > 0) derivedStatus = 'PENDING'; // Needs grading
                 else if (subs.length > 0 && pending === 0) derivedStatus = 'GRADED';
                 else derivedStatus = 'NO_SUBS';
             }
             return { ...a, derivedStatus, pendingCount: subs.filter(s => s.status === 'PENDING').length };
        });

        // Filter (Only for Teachers primarily as requested)
        if (user?.role === UserRole.TEACHER) {
             if (filterStatus === 'PENDING') processed = processed.filter(a => a.derivedStatus === 'PENDING');
             if (filterStatus === 'GRADED') processed = processed.filter(a => a.derivedStatus === 'GRADED');
        }

        // Sort
        processed.sort((a, b) => {
            if (sortConfig.key === 'title') {
                return sortConfig.direction === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            } else {
                 const da = new Date(a.dueDate).getTime();
                 const db = new Date(b.dueDate).getTime();
                 return sortConfig.direction === 'asc' ? da - db : db - da;
            }
        });

        return processed;
    }, [assignments, sortConfig, filterStatus, user]);

    if (view === 'CREATE' && user?.role === UserRole.TEACHER) {
        return (
            <div className="bg-white dark:bg-space-900 rounded-[2rem] p-8 shadow-sm border border-stone-100 dark:border-space-800 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-serif text-stone-800 dark:text-white">Create Assignment</h2>
                    <button onClick={() => setView('LIST')} className="text-stone-500 dark:text-slate-400 hover:text-red-500 font-bold text-sm">Cancel</button>
                </div>
                <div className="space-y-6">
                    <input className="w-full text-xl font-bold font-serif border-b-2 border-stone-200 dark:border-space-800 p-2 focus:border-nature-500 dark:focus:border-space-accent outline-none bg-transparent placeholder:text-stone-300 dark:placeholder:text-slate-600 dark:text-white" placeholder="Assignment Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <textarea className="w-full p-4 bg-paper dark:bg-space-950 rounded-xl border border-stone-200 dark:border-space-800 focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none dark:text-white" placeholder="Instructions or Description..." rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                    
                    <div className="space-y-4">
                        {newQuestions.map((q, idx) => (
                            <div key={q.id} className="p-6 rounded-2xl border border-stone-200 dark:border-space-800 bg-paper dark:bg-space-950 relative group">
                                <button onClick={() => setNewQuestions(newQuestions.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-stone-300 dark:text-space-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="font-bold text-stone-400 dark:text-slate-500 font-serif">Q{idx+1}</span>
                                    <span className="text-[10px] font-bold uppercase bg-stone-200 dark:bg-space-800 text-stone-600 dark:text-slate-300 px-2 py-1 rounded tracking-wider">{q.type.replace('_', ' ')}</span>
                                    <input className="w-20 text-xs p-1.5 border border-stone-200 dark:border-space-700 rounded ml-auto text-center font-bold bg-white dark:bg-space-900 dark:text-white" type="number" value={q.points} onChange={e => {
                                        const newQ = [...newQuestions];
                                        newQ[idx].points = parseInt(e.target.value);
                                        setNewQuestions(newQ);
                                    }} placeholder="Pts" />
                                </div>
                                <input className="w-full mb-4 p-2.5 border border-stone-200 dark:border-space-700 rounded-lg bg-white dark:bg-space-900 dark:text-white focus:border-nature-500 dark:focus:border-space-accent outline-none" placeholder="Question Text" value={q.text} onChange={e => {
                                    const newQ = [...newQuestions];
                                    newQ[idx].text = e.target.value;
                                    setNewQuestions(newQ);
                                }} />
                                {q.type === 'MCQ' && (
                                    <div className="space-y-2 pl-4 border-l-2 border-stone-200 dark:border-space-800">
                                        {q.options?.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full border-2 cursor-pointer ${q.correctAnswer === opt && opt !== '' ? 'bg-nature-500 dark:bg-space-accent border-nature-500 dark:border-space-accent' : 'border-stone-300 dark:border-space-700'}`} onClick={() => {
                                                    const newQ = [...newQuestions];
                                                    newQ[idx].correctAnswer = opt;
                                                    setNewQuestions(newQ);
                                                }} />
                                                <input className="flex-1 p-1 text-sm bg-transparent border-b border-transparent focus:border-stone-300 dark:focus:border-space-600 outline-none dark:text-white" placeholder={`Option ${oIdx+1}`} value={opt} onChange={e => {
                                                    const newQ = [...newQuestions];
                                                    newQ[idx].options![oIdx] = e.target.value;
                                                    setNewQuestions(newQ);
                                                }} />
                                            </div>
                                        ))}
                                        <button onClick={() => {
                                            const newQ = [...newQuestions];
                                            newQ[idx].options?.push('');
                                            setNewQuestions(newQ);
                                        }} className="text-xs text-nature-600 dark:text-space-accent font-bold mt-2 hover:underline">+ Add Option</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => addQuestion('MCQ')} className="flex-1 py-4 border-2 border-dashed border-stone-200 dark:border-space-700 rounded-xl text-stone-500 dark:text-slate-400 font-bold hover:border-nature-500 dark:hover:border-space-accent hover:text-nature-600 dark:hover:text-space-accent transition bg-white dark:bg-space-900">+ Multiple Choice</button>
                        <button onClick={() => addQuestion('SHORT_ANSWER')} className="flex-1 py-4 border-2 border-dashed border-stone-200 dark:border-space-700 rounded-xl text-stone-500 dark:text-slate-400 font-bold hover:border-nature-500 dark:hover:border-space-accent hover:text-nature-600 dark:hover:text-space-accent transition bg-white dark:bg-space-900">+ Short Answer</button>
                    </div>

                    <button onClick={handleCreate} className="w-full bg-nature-700 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/20 hover:bg-nature-800 dark:hover:bg-indigo-700 transition transform active:scale-[0.98]">Publish Assignment</button>
                </div>
            </div>
        );
    }

    if (view === 'TAKE' && selectedAssignment) {
        return <TakeAssignment assignment={selectedAssignment} onBack={() => { setView('LIST'); setSelectedAssignment(null); }} />;
    }

    if (view === 'SUBMISSIONS' && selectedAssignment) {
        return <SubmissionsView assignment={selectedAssignment} onBack={() => { setView('LIST'); setSelectedAssignment(null); }} />;
    }

    return (
        <div className="space-y-6">
            {user?.role === UserRole.TEACHER && (
                <>
                <button onClick={() => setView('CREATE')} className="w-full py-8 border-2 border-dashed border-stone-300 dark:border-space-700 rounded-[2rem] flex flex-col items-center justify-center text-stone-500 dark:text-slate-400 hover:border-nature-500 dark:hover:border-space-accent hover:text-nature-600 dark:hover:text-space-accent hover:bg-nature-50/50 dark:hover:bg-space-900/50 transition-all group bg-white dark:bg-space-900">
                    <div className="p-3 bg-stone-100 dark:bg-space-800 rounded-full mb-3 group-hover:bg-nature-100 dark:group-hover:bg-space-800 transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold font-serif">Create New Assignment</span>
                </button>

                {/* Teacher Filter & Sort Controls */}
                <div className="bg-white dark:bg-space-900 p-4 rounded-2xl border border-stone-100 dark:border-space-800 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                    <div className="flex gap-2 bg-stone-50 dark:bg-space-950 p-1 rounded-xl">
                       <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filterStatus === 'ALL' ? 'bg-white dark:bg-space-800 shadow-sm text-stone-800 dark:text-white' : 'text-stone-500 dark:text-slate-500 hover:text-stone-800 dark:hover:text-white'}`}>All</button>
                       <button onClick={() => setFilterStatus('PENDING')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filterStatus === 'PENDING' ? 'bg-white dark:bg-space-800 shadow-sm text-stone-800 dark:text-white' : 'text-stone-500 dark:text-slate-500 hover:text-stone-800 dark:hover:text-white'}`}>Needs Grading</button>
                       <button onClick={() => setFilterStatus('GRADED')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filterStatus === 'GRADED' ? 'bg-white dark:bg-space-800 shadow-sm text-stone-800 dark:text-white' : 'text-stone-500 dark:text-slate-500 hover:text-stone-800 dark:hover:text-white'}`}>Graded</button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Sort</span>
                        <select 
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key: key as any, direction: direction as any });
                            }} 
                            className="bg-stone-50 dark:bg-space-950 border border-stone-200 dark:border-space-800 text-stone-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none"
                        >
                             <option value="dueDate-asc">Due Date (Earliest)</option>
                             <option value="dueDate-desc">Due Date (Latest)</option>
                             <option value="title-asc">Title (A-Z)</option>
                        </select>
                    </div>
                </div>
                </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {processedAssignments.map(a => (
                    <div key={a.id} className="bg-white dark:bg-space-900 rounded-[1.5rem] p-6 shadow-sm border border-stone-100 dark:border-space-800 hover:shadow-md transition-shadow flex flex-col group relative">
                         {/* Delete Button for Teachers */}
                         {user?.role === UserRole.TEACHER && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignmentToDelete(a);
                                }}
                                className="absolute top-4 right-4 text-stone-300 dark:text-space-700 hover:text-red-500 transition-colors z-10 p-2"
                                title="Delete Assignment"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-nature-50 dark:bg-space-800 rounded-2xl text-nature-700 dark:text-space-accent border border-nature-100 dark:border-space-700">
                                <Award className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-widest bg-stone-50 dark:bg-space-950 px-3 py-1.5 rounded-full border border-stone-100 dark:border-space-800">{a.questions.length} Questions</span>
                                {user?.role === UserRole.TEACHER && a.pendingCount > 0 && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/30">{a.pendingCount} to Grade</span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold font-serif text-stone-800 dark:text-white mb-2 group-hover:text-nature-700 dark:group-hover:text-space-accent transition-colors">{a.title}</h3>
                        <p className="text-stone-500 dark:text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">{a.description}</p>
                        <div className="mt-auto pt-4 border-t border-stone-50 dark:border-space-800 flex justify-between items-center">
                            <span className="text-xs text-stone-400 dark:text-slate-500 font-bold uppercase tracking-wider">Due {new Date(a.dueDate).toLocaleDateString()}</span>
                            {user?.role === UserRole.STUDENT ? (
                                <button 
                                    onClick={() => { setSelectedAssignment(a); setView('TAKE'); }}
                                    className="px-5 py-2 bg-stone-800 dark:bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-nature-700 dark:hover:bg-indigo-500 transition shadow-lg shadow-stone-800/10 dark:shadow-indigo-500/20"
                                >
                                    Start
                                </button>
                            ) : (
                                <button onClick={() => { setSelectedAssignment(a); setView('SUBMISSIONS'); }} className="text-sm font-bold text-nature-600 dark:text-space-accent hover:underline">View Submissions</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {processedAssignments.length === 0 && user?.role !== UserRole.TEACHER && (
                <div className="text-center text-stone-400 dark:text-slate-600 py-16 bg-white dark:bg-space-900/60 rounded-[2rem] border-2 border-dashed border-stone-100 dark:border-space-800">
                    <p className="font-serif italic">No active assignments. Enjoy the break!</p>
                </div>
            )}
             {processedAssignments.length === 0 && user?.role === UserRole.TEACHER && (
                <div className="text-center text-stone-400 dark:text-slate-600 py-16">
                    <p className="font-serif italic">No assignments match your filter.</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {assignmentToDelete && (
                <div className="fixed inset-0 bg-stone-900/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-space-900 p-8 rounded-[2rem] w-full max-w-md shadow-2xl dark:border dark:border-space-800">
                        <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-white mb-4">Delete Assignment?</h3>
                        <p className="text-stone-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-stone-800 dark:text-white">"{assignmentToDelete.title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setAssignmentToDelete(null)}
                                className="px-6 py-3 text-stone-500 dark:text-slate-400 font-bold hover:text-stone-800 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    assignmentService.delete(assignmentToDelete.id);
                                    setAssignments(assignments.filter(a => a.id !== assignmentToDelete.id));
                                    setAssignmentToDelete(null);
                                }}
                                className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-transform active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};