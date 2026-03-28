import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import {
  analyzeSkillGap,
  generateCareerMission,
  generateDailyTasks,
  generateInterviewPrepPlan,
  generateInterviewQuestions,
  generatePromptFallback,
  generateRoadmap,
  generateText,
  generateJSON,
  getAiDebugInfo,
  isQuotaExceededError,
  optimizeResume,
  streamText,
  type CareerRoadmap,
  type DailyTask,
  type InterviewPrepPlan,
  type InterviewQuestion,
  type MissionPlan,
  type SkillGapAnalysis,
} from "@/services/ai";
import type { ATSAnalysis } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SupportedAction =
  | "career_mission"
  | "skill_gap"
  | "resume_optimization"
  | "interview_prep_plan"
  | "interview_questions"
  | "career_roadmap"
  | "generate_tasks"
  | "prompt";

type AIResponseData =
  | MissionPlan
  | SkillGapAnalysis
  | ATSAnalysis
  | InterviewPrepPlan
  | InterviewQuestion[]
  | CareerRoadmap
  | DailyTask[]
  | string
  | unknown;

type SessionAction = Exclude<SupportedAction, "prompt">;

const SESSION_TYPE_BY_ACTION: Record<
  SessionAction,
  "mission" | "skill_gap" | "resume" | "interview" | "roadmap" | "tasks"
> = {
  career_mission: "mission",
  skill_gap: "skill_gap",
  resume_optimization: "resume",
  interview_prep_plan: "interview",
  interview_questions: "interview",
  career_roadmap: "roadmap",
  generate_tasks: "tasks",
};

type CacheEntry = {
  expiresAt: number;
  value: AIResponseData;
};

const PROMPT_CACHE_TTL_MS = 1000 * 60 * 10;
const promptCache = new Map<string, CacheEntry>();

function badRequest(message: string, action?: string, requestId?: string) {
  return NextResponse.json(
    {
      ok: false,
      action: action ?? null,
      error: message,
      debug: {
        ...getAiDebugInfo(),
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 400 }
  );
}

function requireString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

function summarizeForLog(value: unknown, maxLength = 240) {
  const raw =
    typeof value === "string" ? value : JSON.stringify(value, null, 0) || "";

  return raw.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function resolveAction(action: unknown): SupportedAction | null {
  switch (action) {
    case "career_mission":
    case "generateCareerMission":
    case "mission":
      return "career_mission";
    case "skill_gap":
    case "analyzeSkillGap":
      return "skill_gap";
    case "resume_optimization":
    case "optimizeResume":
    case "ats_score":
      return "resume_optimization";
    case "interview_prep_plan":
    case "generateInterviewPrepPlan":
      return "interview_prep_plan";
    case "interview_questions":
    case "generateInterviewQuestions":
    case "interview":
      return "interview_questions";
    case "career_roadmap":
    case "generateRoadmap":
      return "career_roadmap";
    case "generate_tasks":
      return "generate_tasks";
    default:
      return null;
  }
}

function getPromptCacheKey(prompt: string, responseType?: unknown) {
  return JSON.stringify({
    prompt: prompt.trim(),
    responseType: responseType === "json" ? "json" : "text",
  });
}

function readPromptCache(prompt: string, responseType?: unknown) {
  const cached = promptCache.get(getPromptCacheKey(prompt, responseType));

  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    promptCache.delete(getPromptCacheKey(prompt, responseType));
    return null;
  }

  return cached.value;
}

function writePromptCache(prompt: string, responseType: unknown, value: AIResponseData) {
  promptCache.set(getPromptCacheKey(prompt, responseType), {
    expiresAt: Date.now() + PROMPT_CACHE_TTL_MS,
    value,
  });
}

async function requireAuthenticatedUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function persistAiSession(
  userId: string,
  action: SessionAction,
  input: unknown,
  output: unknown
) {
  try {
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("ai_sessions").insert({
      user_id: userId,
      session_type: SESSION_TYPE_BY_ACTION[action],
      prompt_summary: summarizeForLog(input, 280),
      response_summary: summarizeForLog(output, 280),
      metadata: {
        action,
        model: getAiDebugInfo().model,
      },
    });

    if (error) {
      console.warn("[AI API] Failed to persist ai_session:", error);
    }
  } catch (error) {
    console.warn("[AI API] Unexpected ai_session logging failure:", error);
  }
}

function rateLimitResponse(requestId: string, resetAt: number) {
  return NextResponse.json(
    {
      ok: false,
      action: null,
      error: "AI rate limit exceeded. Please wait a moment and try again.",
      debug: {
        ...getAiDebugInfo(),
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
      },
    }
  );
}

function successResponse(
  action: SupportedAction,
  requestId: string,
  data: AIResponseData
) {
  return NextResponse.json({
    ok: true,
    action,
    data,
    debug: {
      ...getAiDebugInfo(),
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const user = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        action: null,
        error: "Unauthorized",
        debug: {
          ...getAiDebugInfo(),
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 401 }
    );
  }

  const limit = checkAiRateLimit(user.id);
  if (!limit.allowed) {
    return rateLimitResponse(requestId, limit.resetAt);
  }

  try {
    const body = await request.json();
    const { prompt, responseType, stream } = body ?? {};
    const action = resolveAction(body?.action);

    console.info(
      `[AI API] requestId=${requestId} user=${user.id} action=${action ?? "prompt"}`
    );

    if (typeof prompt === "string" && prompt.trim()) {
      const cachedPromptResponse = !stream ? readPromptCache(prompt, responseType) : null;

      if (cachedPromptResponse !== null) {
        return successResponse("prompt", requestId, cachedPromptResponse);
      }

      if (stream) {
        let aiStream;
        try {
          aiStream = await streamText(prompt);
        } catch (error) {
          if (isQuotaExceededError(error)) {
            const fallbackText = generatePromptFallback(prompt);
            console.warn(
              `[AI API] requestId=${requestId} using prompt stream fallback due to quota exhaustion`
            );
            writePromptCache(prompt, "text", fallbackText);

            return new Response(fallbackText, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-store",
                "X-AI-Request-Id": requestId,
                "X-AI-Provider": "fallback",
                "X-AI-Model": "local-fallback",
              },
            });
          }

          throw error;
        }
        const encoder = new TextEncoder();
        let fullText = "";

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of aiStream) {
                const text = chunk.text();
                if (!text) continue;
                fullText += text;
                controller.enqueue(encoder.encode(text));
              }

              if (!fullText.trim()) {
                throw new Error("The AI stream completed without content.");
              }

              controller.close();
            } catch (error) {
              console.error(`[AI API] requestId=${requestId} stream failed:`, error);
              controller.error(error);
            } finally {
              console.info(
                `[AI API] requestId=${requestId} streamed_chars=${fullText.length}`
              );
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-AI-Request-Id": requestId,
            "X-AI-Provider": "gemini",
            "X-AI-Model": getAiDebugInfo().model,
          },
        });
      }

      let data;
      try {
        data =
          responseType === "json"
            ? await generateJSON(prompt)
            : await generateText(prompt);
      } catch (error) {
        if (responseType !== "json" && isQuotaExceededError(error)) {
          data = generatePromptFallback(prompt);
        } else {
          throw error;
        }
      }

      writePromptCache(prompt, responseType, data);

      return successResponse("prompt", requestId, data);
    }

    if (!action) {
      return badRequest(
        "Provide a supported AI action or a prompt.",
        undefined,
        requestId
      );
    }

    switch (action) {
      case "career_mission": {
        const data = await generateCareerMission({
          role: requireString(body.role, "Role is required."),
          company: optionalString(body.company),
          experience: requireString(body.experience, "Experience is required."),
          description: optionalString(body.description),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "skill_gap": {
        const data = await analyzeSkillGap({
          industry: optionalString(body.industry),
          skills: requireStringArray(body.skills),
          targetRole: optionalString(body.role),
          experience: optionalString(body.experience),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "resume_optimization": {
        const data = await optimizeResume({
          content: requireString(body.content, "Resume content is required."),
          targetRole: optionalString(body.role),
          industry: optionalString(body.industry),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "interview_prep_plan": {
        const data = await generateInterviewPrepPlan({
          role: requireString(body.role, "Role is required."),
          level: requireString(body.level, "Interview level is required."),
          interviewType: requireString(
            body.interviewType,
            "Interview type is required."
          ),
          industry: optionalString(body.industry),
          skills: requireStringArray(body.skills),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "interview_questions": {
        const data = await generateInterviewQuestions({
          industry: optionalString(body.industry),
          skills: requireStringArray(body.skills),
          role: optionalString(body.role),
          level: optionalString(body.level),
          interviewType: optionalString(body.interviewType),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "career_roadmap": {
        const data = await generateRoadmap({
          industry: optionalString(body.industry),
          role: requireString(body.role, "Role is required for roadmap generation."),
          skills: requireStringArray(body.skills),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "generate_tasks": {
        if (
          typeof body.mission !== "object" ||
          body.mission === null ||
          typeof body.mission.title !== "string" ||
          typeof body.mission.description !== "string"
        ) {
          throw new Error("Mission title and description are required.");
        }

        const data = await generateDailyTasks({
          mission: {
            title: body.mission.title,
            description: body.mission.description,
            target_role:
              typeof body.mission.target_role === "string"
                ? body.mission.target_role
                : undefined,
          },
          industry: optionalString(body.industry),
        });
        await persistAiSession(user.id, action, body, data);
        return successResponse(action, requestId, data);
      }
      case "prompt":
        return badRequest("Prompt text is required.", action, requestId);
      default:
        return badRequest("Unsupported AI action.", action, requestId);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI request failed";
    const status = message.toLowerCase().includes("required") ? 400 : 500;

    console.error(`[AI API] requestId=${requestId} failed:`, error);

    return NextResponse.json(
      {
        ok: false,
        action: null,
        error: message,
        debug: {
          ...getAiDebugInfo(),
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status }
    );
  }
}
