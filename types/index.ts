// ─── User & Profile ───────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  industry: string | null;
  sub_industry: string | null;
  experience: number | null;
  skills: string[];
  bio: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Mission System ───────────────────────────
export type MissionStatus = "active" | "paused" | "completed" | "abandoned";

export interface Mission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_role: string | null;
  target_company: string | null;
  status: MissionStatus;
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
}

// ─── Task Engine ──────────────────────────────
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  user_id: string;
  mission_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

// ─── Resume ───────────────────────────────────
export interface Resume {
  id: string;
  user_id: string;
  content: string;
  ats_score: number | null;
  ats_analysis: ATSAnalysis | null;
  updated_at: string;
}

export interface ATSAnalysis {
  overallScore: number;
  sections: Record<string, { score: number; tip: string; found?: string[]; missing?: string[] }>;
  topSuggestions: string[];
  summary: string;
}

// ─── Hireability Score ────────────────────────
export interface HireabilityScore {
  id: string;
  user_id: string;
  score: number; // 0-100
  breakdown: ScoreBreakdown;
  computed_at: string;
}

export interface ScoreBreakdown {
  profile_completeness: number;
  skill_alignment: number;
  task_completion: number;
  interview_readiness: number;
  resume_quality: number;
}

// ─── Interview ────────────────────────────────
export interface InterviewLog {
  id: string;
  user_id: string;
  quiz_score: number;
  questions: QuestionResult[];
  improvement_tip: string | null;
  created_at: string;
}

export type InterviewRole =
  | "sde"
  | "frontend"
  | "backend"
  | "ml_engineer"
  | "core_engineering";

export type InterviewLevel = "beginner" | "intermediate" | "advanced";

export type InterviewType =
  | "dsa"
  | "system_design"
  | "behavioral"
  | "project_based"
  | "mixed";

export interface InterviewPreference {
  id: string;
  user_id: string;
  role: InterviewRole;
  level: InterviewLevel;
  interview_type: InterviewType;
  created_at: string;
  updated_at: string;
}

export interface QuestionResult {
  question: string;
  options: string[];
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

// ─── AI Sessions ──────────────────────────────
export type AISessionType = "mission" | "skill_gap" | "resume" | "interview" | "roadmap" | "tasks";

export interface AISession {
  id: string;
  user_id: string;
  session_type: AISessionType;
  prompt_summary: string;
  response_summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Applications ─────────────────────────────
export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offered" | "rejected" | "accepted";

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  url: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
}
