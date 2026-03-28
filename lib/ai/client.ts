import type { ATSAnalysis } from "@/types";
import type {
  CareerMissionInput,
  CareerRoadmap,
  DailyTask,
  InterviewPrepInput,
  InterviewPrepPlan,
  InterviewQuestion,
  MissionPlan,
  ResumeOptimizationInput,
  RoadmapInput,
  SkillGapAnalysis,
  SkillGapInput,
} from "@/services/ai";

interface AIClientResponse<T> {
  ok: boolean;
  action: string | null;
  data?: T;
  error?: string;
  debug?: {
    provider: string;
    model: string;
    requestId: string;
    timestamp: string;
  };
}

async function postAI<T>(payload: Record<string, unknown>) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as AIClientResponse<T>;

  if (!response.ok || !json.ok || json.error || typeof json.data === "undefined") {
    const debugSuffix = json.debug?.requestId
      ? ` (request ${json.debug.requestId})`
      : "";
    throw new Error((json.error || "AI request failed.") + debugSuffix);
  }

  return json.data;
}

export async function generateCareerMissionRequest(input: CareerMissionInput) {
  return postAI<MissionPlan>({
    action: "career_mission",
    ...input,
  });
}

export async function analyzeSkillGapRequest(input: SkillGapInput) {
  return postAI<SkillGapAnalysis>({
    action: "skill_gap",
    industry: input.industry,
    skills: input.skills,
    role: input.targetRole,
    experience: input.experience,
  });
}

export async function optimizeResumeRequest(input: ResumeOptimizationInput) {
  return postAI<ATSAnalysis>({
    action: "resume_optimization",
    content: input.content,
    role: input.targetRole,
    industry: input.industry,
  });
}

export async function generateInterviewQuestionsRequest(input: {
  industry?: string;
  skills?: string[];
  role?: string;
  level?: string;
  interviewType?: string;
}) {
  return postAI<InterviewQuestion[]>({
    action: "interview_questions",
    ...input,
  });
}

export async function generateInterviewPrepPlanRequest(input: InterviewPrepInput) {
  return postAI<InterviewPrepPlan>({
    action: "interview_prep_plan",
    ...input,
  });
}

export async function generateRoadmapRequest(input: RoadmapInput) {
  return postAI<CareerRoadmap>({
    action: "career_roadmap",
    ...input,
  });
}

export async function generateDailyTasksRequest(input: {
  mission: {
    title: string;
    description: string;
    target_role?: string;
  };
  industry?: string;
}) {
  return postAI<DailyTask[]>({
    action: "generate_tasks",
    ...input,
  });
}

export async function promptAIText(prompt: string) {
  return postAI<string>({
    prompt,
    responseType: "text",
  });
}

export async function promptAIJSON<T>(prompt: string) {
  return postAI<T>({
    prompt,
    responseType: "json",
  });
}
