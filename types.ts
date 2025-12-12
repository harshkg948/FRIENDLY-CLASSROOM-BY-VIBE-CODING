export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mobile: string;
  course?: string;
  branch?: string;
  semester?: string;
  idCardDetails?: string;
}

export interface Classroom {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  semester: string;
  schedule: string;
  students: string[];
  attendanceThreshold?: number; // Minimum percentage required (e.g., 75)
  nextClassTime?: number; // Timestamp for the next scheduled class
}

export interface AttendanceSession {
  id: string;
  classroomId: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  teacherLocation?: { lat: number; lng: number };
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: number;
  status: 'PRESENT' | 'ABSENT' | 'BUNK';
  locationDifference?: number; // in meters
}

export type QuestionType = 'MCQ' | 'SHORT_ANSWER';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: string[]; // Only for MCQ
  correctAnswer?: string; // Teacher reference
}

export interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  questions: Question[];
  totalPoints: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>; // questionId -> answer
  submittedAt: number;
  grade?: number;
  feedback?: string; // Teacher textual feedback
  status: 'PENDING' | 'GRADED';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}