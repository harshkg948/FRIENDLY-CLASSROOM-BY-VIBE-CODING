import { User, Classroom, AttendanceSession, AttendanceRecord, Assignment, Submission, UserRole } from '../types';

const DB_KEY = 'friendly_classroom_db_v2';

interface DB {
  users: User[];
  classrooms: Classroom[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  submissions: Submission[];
}

const getDB = (): DB => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    const initial: DB = { users: [], classrooms: [], attendanceSessions: [], attendanceRecords: [], assignments: [], submissions: [] };
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const saveDB = (db: DB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const userService = {
  register: (user: User): User => {
    const db = getDB();
    if (db.users.find(u => u.email === user.email)) {
      throw new Error('User already exists');
    }
    db.users.push(user);
    saveDB(db);
    return user;
  },
  login: (email: string): User | undefined => {
    const db = getDB();
    return db.users.find(u => u.email === email);
  },
  getUser: (id: string) => getDB().users.find(u => u.id === id),
  getUsersByIds: (ids: string[]) => {
    const db = getDB();
    return db.users.filter(u => ids.includes(u.id));
  }
};

export const classroomService = {
  create: (c: Classroom): Classroom => {
    const db = getDB();
    db.classrooms.push(c);
    saveDB(db);
    return c;
  },
  update: (id: string, updates: Partial<Classroom>) => {
    const db = getDB();
    const idx = db.classrooms.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.classrooms[idx] = { ...db.classrooms[idx], ...updates };
      saveDB(db);
      return db.classrooms[idx];
    }
    return null;
  },
  join: (classId: string, studentId: string): boolean => {
    const db = getDB();
    const classroom = db.classrooms.find(c => c.id === classId);
    if (!classroom) return false;
    if (!classroom.students.includes(studentId)) {
      classroom.students.push(studentId);
      saveDB(db);
    }
    return true;
  },
  listForTeacher: (teacherId: string) => getDB().classrooms.filter(c => c.teacherId === teacherId),
  listForStudent: (studentId: string) => getDB().classrooms.filter(c => c.students.includes(studentId)),
  get: (id: string) => getDB().classrooms.find(c => c.id === id),
};

export const attendanceService = {
  startSession: (classroomId: string, teacherLocation: { lat: number, lng: number }): AttendanceSession => {
    const db = getDB();
    // Close any existing active sessions for this class
    db.attendanceSessions.forEach(s => {
        if(s.classroomId === classroomId) s.isActive = false;
    });

    const session: AttendanceSession = {
      id: Date.now().toString(),
      classroomId,
      startTime: Date.now(),
      endTime: Date.now() + 60 * 1000, // 1 minute
      isActive: true,
      teacherLocation
    };
    db.attendanceSessions.push(session);
    saveDB(db);
    return session;
  },
  getActiveSession: (classroomId: string): AttendanceSession | undefined => {
    const db = getDB();
    return db.attendanceSessions.find(s => s.classroomId === classroomId && s.isActive && Date.now() < s.endTime);
  },
  getSessions: (classroomId: string): AttendanceSession[] => {
    const db = getDB();
    return db.attendanceSessions
      .filter(s => s.classroomId === classroomId)
      .sort((a, b) => b.startTime - a.startTime);
  },
  markAttendance: (record: AttendanceRecord) => {
    const db = getDB();
    const existing = db.attendanceRecords.find(r => r.sessionId === record.sessionId && r.studentId === record.studentId);
    if (!existing) {
      db.attendanceRecords.push(record);
      saveDB(db);
    }
  },
  getRecords: (sessionId: string) => getDB().attendanceRecords.filter(r => r.sessionId === sessionId),
  getRecordForStudent: (sessionId: string, studentId: string) => 
    getDB().attendanceRecords.find(r => r.sessionId === sessionId && r.studentId === studentId),
};

export const assignmentService = {
    create: (assignment: Assignment) => {
        const db = getDB();
        db.assignments.push(assignment);
        saveDB(db);
    },
    list: (classroomId: string) => getDB().assignments.filter(a => a.classroomId === classroomId),
    get: (id: string) => getDB().assignments.find(a => a.id === id),
    delete: (id: string) => {
        const db = getDB();
        db.assignments = db.assignments.filter(a => a.id !== id);
        saveDB(db);
    },
    
    submit: (submission: Submission) => {
        const db = getDB();
        // Remove old submission if exists (resubmit allowed)
        const idx = db.submissions.findIndex(s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId);
        if (idx >= 0) db.submissions.splice(idx, 1);
        
        db.submissions.push(submission);
        saveDB(db);
    },
    getSubmissions: (assignmentId: string) => getDB().submissions.filter(s => s.assignmentId === assignmentId),
    getMySubmission: (assignmentId: string, studentId: string) => getDB().submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId),
    grade: (submissionId: string, grade: number, feedback?: string) => {
        const db = getDB();
        const sub = db.submissions.find(s => s.id === submissionId);
        if (sub) {
            sub.grade = grade;
            if (feedback) sub.feedback = feedback;
            sub.status = 'GRADED';
            saveDB(db);
        }
    }
};