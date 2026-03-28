import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ATSAnalysis } from "@/types";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 45000);

export interface CareerMissionInput {
  role: string;
  company?: string;
  experience: string;
  description?: string;
}

export interface MissionPlanTask {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  due_in_days: number;
}

export interface MissionPlan {
  mission_title: string;
  mission_description: string;
  tasks: MissionPlanTask[];
}

export interface SkillGapInput {
  industry?: string;
  skills?: string[];
  targetRole?: string;
  experience?: string;
}

export interface SkillGapAnalysis {
  overallReadiness: number;
  matched: string[];
  missing: Array<{
    skill: string;
    priority: "high" | "medium" | "low";
    learningPath: string;
  }>;
  summary: string;
}

export interface ResumeOptimizationInput {
  content: string;
  targetRole?: string;
  industry?: string;
}

export interface InterviewQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface InterviewQuestionInput {
  industry?: string;
  skills?: string[];
  role?: string;
  level?: string;
  interviewType?: string;
}

export interface InterviewPrepInput {
  role: string;
  level: string;
  interviewType: string;
  industry?: string;
  skills?: string[];
}

export interface InterviewPrepPlan {
  summary: string;
  topics: Array<{
    title: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
  practiceQuestions: string[];
  mockTasks: string[];
  timeline: Array<{
    label: string;
    focus: string;
  }>;
}

export interface RoadmapInput {
  industry?: string;
  role: string;
  skills?: string[];
}

export interface CareerRoadmap {
  phases: Array<{
    phase: number;
    title: string;
    weeks: string;
    goals: string[];
    milestones: string[];
  }>;
  summary: string;
}

export interface DailyTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface DailyTaskInput {
  mission: {
    title: string;
    description: string;
    target_role?: string;
  };
  industry?: string;
}

export function isQuotaExceededError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("quota exceeded") ||
    message.includes("429 too many requests") ||
    message.includes("exceeded your current quota")
  );
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  return new GoogleGenerativeAI(apiKey);
}

export function getAiDebugInfo() {
  return {
    provider: "gemini",
    model: DEFAULT_MODEL,
  };
}

function stripCodeFences(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonCandidate(value: string) {
  const cleaned = stripCodeFences(value);
  const objectStart = cleaned.indexOf("{");
  const arrayStart = cleaned.indexOf("[");

  if (
    objectStart !== -1 &&
    (arrayStart === -1 || objectStart < arrayStart)
  ) {
    const objectEnd = cleaned.lastIndexOf("}");
    if (objectEnd > objectStart) {
      return cleaned.slice(objectStart, objectEnd + 1);
    }
  }

  if (arrayStart !== -1) {
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayEnd > arrayStart) {
      return cleaned.slice(arrayStart, arrayEnd + 1);
    }
  }

  return cleaned;
}

function normalizeJsonCandidate(value: string) {
  return extractJsonCandidate(value)
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function tryParseJson<T>(rawText: string) {
  return JSON.parse(normalizeJsonCandidate(rawText)) as T;
}

function normalizeList(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roleLabel(value?: string) {
  return asString(value, "software engineering").replace(/_/g, " ");
}

function interviewTypeLabel(value?: string) {
  return asString(value, "mixed").replace(/_/g, " ");
}

function buildInterviewPrepPlanFallback(input: InterviewPrepInput): InterviewPrepPlan {
  const role = roleLabel(input.role);
  const level = asString(input.level, "intermediate").toLowerCase();
  const focus = interviewTypeLabel(input.interviewType);
  const primarySkill = normalizeList(input.skills)[0] || "execution clarity";

  return {
    summary: `Focused ${level} ${role} preparation plan centered on ${focus}, calibrated from your profile and current skills.`,
    topics: [
      {
        title: `${role} foundations`,
        reason: `Rebuild confidence around the concepts that recur most often in ${focus} rounds.`,
        priority: "high",
      },
      {
        title: `${focus} problem patterns`,
        reason: "Practice the recurring prompts, tradeoffs, and answer structures interviewers expect.",
        priority: "high",
      },
      {
        title: `${primarySkill} storytelling`,
        reason: "Turn your experience into clear, credible answers with better signal and structure.",
        priority: "medium",
      },
    ],
    practiceQuestions: [
      `What does strong performance look like for a ${role} candidate at the ${level} level?`,
      `How would you structure an answer for a representative ${focus} question?`,
      `Which project best demonstrates your readiness, and how would you explain its impact?`,
      "What tradeoffs would you call out before jumping into implementation details?",
    ],
    mockTasks: [
      "Run one timed mock session and note every hesitation point.",
      "Rewrite weak answers using a clearer framework and stronger outcomes.",
      "Practice one project story with problem, action, tradeoff, and impact.",
    ],
    timeline: [
      { label: "Day 1-2", focus: "Refresh fundamentals and identify weak spots" },
      { label: "Day 3-5", focus: "Drill targeted questions under light time pressure" },
      { label: "Day 6-7", focus: "Run a full mock loop and refine communication" },
      { label: "Day 8+", focus: "Repeat with harder prompts and tighter answers" },
    ],
  };
}

function buildInterviewQuestionFallback(input: InterviewQuestionInput): InterviewQuestion[] {
  const role = roleLabel(input.role);
  const focus = interviewTypeLabel(input.interviewType);
  const skills = normalizeList(input.skills);
  const level = asString(input.level, "intermediate").toLowerCase();
  const strongestSkill = skills[0] || "problem solving";
  const secondarySkill = skills[1] || "communication";

  return [
    {
      question: `For a ${role} interview focused on ${focus}, what should you do first when given a new problem?`,
      options: [
        "Clarify requirements, constraints, and success criteria",
        "Start coding immediately before understanding the prompt",
        "Ask to skip directly to the next question",
        "Memorize a template and repeat it regardless of context",
      ],
      correctAnswer: "Clarify requirements, constraints, and success criteria",
      explanation:
        "Strong candidates slow down just enough to frame the problem, surface assumptions, and choose a deliberate path.",
      difficulty: "easy",
    },
    {
      question: `Which answer best shows ${level} readiness for a ${role} interview?`,
      options: [
        "Explain tradeoffs, reasoning, and measurable impact",
        "List tools without context or outcomes",
        "Keep the answer vague to avoid mistakes",
        "Only mention what the team did, never your contribution",
      ],
      correctAnswer: "Explain tradeoffs, reasoning, and measurable impact",
      explanation:
        "Interviewers want to hear how you think, what you owned, and what changed because of your work.",
      difficulty: "easy",
    },
    {
      question: `You have strong experience in ${strongestSkill}. How should you use it during a ${focus} round?`,
      options: [
        "Use it to support structured reasoning and concrete examples",
        "Mention it once and avoid tying it back to the question",
        "Assume the interviewer already understands your background",
        "Replace problem-solving with buzzwords",
      ],
      correctAnswer: "Use it to support structured reasoning and concrete examples",
      explanation:
        "Your strongest skill should anchor your answer with evidence, not sit separately from the prompt.",
      difficulty: "medium",
    },
    {
      question: `When discussing a project, which structure creates the clearest signal?`,
      options: [
        "Problem, action, tradeoff, impact, and lesson learned",
        "Tool list, framework names, and deployment date only",
        "A long story without outcomes",
        "A surface-level summary with no decisions explained",
      ],
      correctAnswer: "Problem, action, tradeoff, impact, and lesson learned",
      explanation:
        "That structure helps the interviewer follow the context, your contribution, and the business or technical payoff.",
      difficulty: "medium",
    },
    {
      question: `What is the best way to recover if you get stuck in a ${focus} interview?`,
      options: [
        "State the blocker, propose a smaller step, and continue reasoning out loud",
        "Go silent and hope inspiration arrives",
        "Change the topic completely",
        "Pretend you solved it and move on",
      ],
      correctAnswer: "State the blocker, propose a smaller step, and continue reasoning out loud",
      explanation:
        "Recovery skill matters. Interviewers reward candidates who can reset, decompose the problem, and keep momentum.",
      difficulty: "medium",
    },
    {
      question: `Why is ${secondarySkill} important in a ${role} interview, even in technical rounds?`,
      options: [
        "Because clear communication increases trust in your reasoning and decisions",
        "Because communication matters only in HR rounds",
        "Because interviewers ignore collaboration and clarity",
        "Because concise thinking has no impact on evaluation",
      ],
      correctAnswer: "Because clear communication increases trust in your reasoning and decisions",
      explanation:
        "Interview performance is not only about correctness. Clear communication helps the interviewer validate your approach.",
      difficulty: "hard",
    },
  ];
}

function buildMissionFallback(input: CareerMissionInput): MissionPlan {
  return normalizeMissionPlan({}, input);
}

function buildResumeFallback(input: ResumeOptimizationInput): ATSAnalysis {
  const content = input.content.toLowerCase();
  const hasNumbers = /\d/.test(content);
  const hasProjects = /project|projects/.test(content);
  const hasExperience = /experience|work|intern/.test(content);
  const hasSkills = /skills/.test(content);
  const hasEducation = /education|university|college|bachelor|master/.test(content);

  const keywordsScore = clamp(
    45 +
      (input.targetRole ? 10 : 0) +
      (input.industry ? 5 : 0) +
      Math.min(20, normalizeList(input.content.split(/\W+/)).length > 120 ? 15 : 5),
    0,
    100
  );
  const formattingScore = clamp(55 + (content.includes("•") || content.includes("-") ? 15 : 0), 0, 100);
  const experienceScore = clamp(40 + (hasExperience ? 20 : 0) + (hasNumbers ? 20 : 0), 0, 100);
  const completenessScore = clamp(
    30 + (hasProjects ? 15 : 0) + (hasSkills ? 15 : 0) + (hasEducation ? 15 : 0) + (hasExperience ? 15 : 0),
    0,
    100
  );
  const overallScore = Math.round(
    (keywordsScore + formattingScore + experienceScore + completenessScore) / 4
  );

  return {
    overallScore,
    sections: {
      keywords: {
        score: keywordsScore,
        found: normalizeList([input.targetRole || "", input.industry || ""]).slice(0, 3),
        missing: ["Role-specific keywords", "Clear impact language"],
        tip: "Add more keywords from your target role and describe outcomes with stronger business or technical impact.",
      },
      formatting: {
        score: formattingScore,
        found: content.includes("•") || content.includes("-") ? ["Bullet structure"] : [],
        missing: ["Sharper section hierarchy"],
        tip: "Use scannable sections, concise bullets, and consistent formatting so recruiters can parse value quickly.",
      },
      experience: {
        score: experienceScore,
        found: hasNumbers ? ["Quantified achievements"] : [],
        missing: hasNumbers ? [] : ["More measurable outcomes"],
        tip: "Strengthen each experience bullet with ownership, action, and measurable results.",
      },
      completeness: {
        score: completenessScore,
        found: [
          ...(hasExperience ? ["Experience"] : []),
          ...(hasProjects ? ["Projects"] : []),
          ...(hasSkills ? ["Skills"] : []),
          ...(hasEducation ? ["Education"] : []),
        ],
        missing: [
          ...(hasExperience ? [] : ["Experience section"]),
          ...(hasProjects ? [] : ["Projects section"]),
          ...(hasSkills ? [] : ["Skills section"]),
          ...(hasEducation ? [] : ["Education section"]),
        ],
        tip: "Make sure your resume includes all core sections and that each one signals relevance to the target role.",
      },
    },
    topSuggestions: [
      "Tailor the headline and keywords to your target role.",
      "Turn generic responsibilities into measurable achievements.",
      "Highlight the projects or experiences that best match the role you want next.",
    ],
    summary:
      "This fallback ATS review was generated locally because the AI provider is temporarily unavailable. It gives you a usable baseline score and improvement direction until live AI capacity returns.",
  };
}

export function generatePromptFallback(prompt: string) {
  const condensed = prompt.replace(/\s+/g, " ").toLowerCase();
  const extractLineValue = (label: string) => {
    const match = prompt.match(new RegExp(`- ${label}:\\s*(.+)`, "i"));
    return match?.[1]?.trim() || "";
  };

  const latestUserMessageMatch = prompt.match(/Latest user message:\s*([\s\S]*)$/i);
  const latestUserMessage = latestUserMessageMatch?.[1]?.trim() || "";
  const missionTitle = extractLineValue("Active mission");
  const profileSummary = extractLineValue("Profile summary");
  const score = extractLineValue("Hireability score");
  const pendingTasks = extractLineValue("Pending tasks")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (condensed.includes("career execution coach") || condensed.includes("elev8 mentor")) {
    const latestMessageLower = latestUserMessage.toLowerCase();
    const roleMatch = profileSummary.match(/(?:targeting|for|as)\s+([A-Za-z /-]{3,40})/i);
    const roleSignal = roleMatch?.[1]?.trim();
    const primaryTask = pendingTasks[0];
    const focusTheme = latestMessageLower.includes("resume")
      ? "resume"
      : latestMessageLower.includes("outreach") ||
          latestMessageLower.includes("message") ||
          latestMessageLower.includes("linkedin") ||
          latestMessageLower.includes("email")
        ? "outreach"
        : latestMessageLower.includes("project") ||
            latestMessageLower.includes("portfolio") ||
            latestMessageLower.includes("proof")
          ? "project"
          : latestMessageLower.includes("interview")
            ? "interview"
            : latestMessageLower.includes("week") || latestMessageLower.includes("plan")
              ? "plan"
              : "execution";
    const focusLine = latestUserMessage
      ? `Your latest ask: "${latestUserMessage}".`
      : "You’re asking for a sharper next move.";
    const missionLine =
      missionTitle && missionTitle !== "No active mission yet"
        ? `Mission context: ${missionTitle}.`
        : "You do not have a clearly active mission yet, so the next move should create clarity.";
    const scoreLine = score
      ? `Current signal score: ${score}. Use that as the baseline for your next improvement sprint.`
      : "No score baseline is available yet, so use one concrete output today to create momentum.";
    const taskLines = pendingTasks.length > 0
      ? pendingTasks.map((task) => `- ${task}`).join("\n")
      : [
          "- Rewrite one resume bullet with measurable impact",
          "- Ship one proof-of-work update",
          "- Send one focused outreach batch",
        ].join("\n");

    const tailoredActions =
      focusTheme === "resume"
        ? [
            "- Pick the weakest bullet in your resume and rewrite it with ownership, action, and one measurable result.",
            `- Align the top 6-8 keywords to ${roleSignal || "your target role"} and move the strongest proof-of-work above weaker experience.`,
            "- Stop after one section is clearly better, then run ATS scoring again.",
          ]
        : focusTheme === "outreach"
          ? [
              "- Build one short outreach message with role fit, one proof point, and one direct ask.",
              "- Send it to 5 tightly matched people instead of spraying a broad list.",
              "- Track replies in one simple list so follow-up becomes automatic.",
            ]
          : focusTheme === "project"
            ? [
                "- Choose one project proof point that shows hiring signal in under 30 minutes.",
                "- Ship a visible update: README improvement, deployed feature, case study note, or demo clip.",
                "- Convert that update into one resume bullet and one outreach talking point.",
              ]
            : focusTheme === "interview"
              ? [
                  "- Practice one interview story with problem, action, tradeoff, and measurable impact.",
                  "- Time-box one mock answer to 90 seconds so clarity improves under pressure.",
                  "- Write down the two places where your explanation lost sharpness and tighten those first.",
                ]
              : focusTheme === "plan"
                ? [
                    `- Start with ${primaryTask || "one high-signal task"} and finish only the smallest useful version today.`,
                    "- Define one visible output for the next 30 minutes and ignore everything else.",
                    "- Review what moved signal at the end of the session, then queue the next step.",
                  ]
                : [
                    `- Start with ${primaryTask || "one high-signal task"} and complete the smallest version that still creates evidence.`,
                    "- Keep the next action under 30 minutes so momentum survives.",
                    "- Convert progress into a visible artifact: bullet, project update, outreach batch, or mock answer.",
                  ];

    return [
      "Here’s the sharpest next move from your current dashboard context.",
      "",
      focusLine,
      missionLine,
      profileSummary ? `Profile signal: ${profileSummary}.` : "",
      scoreLine,
      "",
      "Priority queue:",
      taskLines,
      "",
      "Recommended move right now:",
      ...tailoredActions,
      "",
      "Execution rule:",
      "- Reduce scope until the next action can be finished in under 30 minutes.",
      "- Convert vague goals into visible outputs: one bullet, one project update, one application batch, or one mock answer.",
      "- When that is done, ask again and I’ll tighten the next step from the updated context.",
    ].join("\n");
  }

  return [
    "Here is a locally reconstructed response while live generation catches up.",
    "",
    "The workflow is still usable, and you can keep moving without waiting on a fresh provider response.",
    "",
    `Prompt summary: ${prompt.slice(0, 180).trim()}`,
  ].join("\n");
}

function normalizeMissionPlan(
  value: unknown,
  input: CareerMissionInput
): MissionPlan {
  const record = asRecord(value);
  const fallbackTitle = input.company
    ? `Land a ${input.role} role at ${input.company}`
    : `Land a ${input.role} role`;
  const fallbackDescription = `Focused execution plan for ${input.role} opportunities.`;
  const rawTasks = Array.isArray(record?.tasks) ? record.tasks : [];

  const tasks = rawTasks
    .map((task, index) => {
      const taskRecord = asRecord(task);
      const title = asString(taskRecord?.title);
      const description = asString(
        taskRecord?.description,
        title ? `Advance ${title.toLowerCase()}.` : ""
      );
      const priority =
        taskRecord?.priority === "critical" ||
        taskRecord?.priority === "high" ||
        taskRecord?.priority === "medium" ||
        taskRecord?.priority === "low"
          ? taskRecord.priority
          : "medium";
      const dueInDays = clamp(Math.round(asNumber(taskRecord?.due_in_days, 7)), 1, 30);

      if (!title) return null;

      return {
        title,
        description,
        priority,
        due_in_days: dueInDays,
      };
    })
    .filter((task): task is MissionPlanTask => Boolean(task))
    .slice(0, 8);

  return {
    mission_title: asString(record?.mission_title, fallbackTitle),
    mission_description: asString(record?.mission_description, fallbackDescription),
    tasks:
      tasks.length > 0
        ? tasks
        : [
            {
              title: `Rewrite your ${input.role} resume`,
              description:
                "Focus the resume on measurable impact, role fit, and role-specific keywords.",
              priority: "high",
              due_in_days: 2,
            },
            {
              title: `Build one proof-of-work project`,
              description:
                "Create a portfolio artifact that demonstrates role-relevant execution and outcomes.",
              priority: "high",
              due_in_days: 5,
            },
            {
              title: "Run a targeted application sprint",
              description:
                "Shortlist aligned companies, customize outreach, and send a focused first batch of applications.",
              priority: "medium",
              due_in_days: 7,
            },
          ],
  };
}

function normalizeAtsSection(
  value: unknown,
  fallbackTip: string
) {
  const record = asRecord(value);

  return {
    score: clamp(Math.round(asNumber(record?.score, 0)), 0, 100),
    found: asStringArray(record?.found),
    missing: asStringArray(record?.missing),
    tip: asString(record?.tip, fallbackTip),
  };
}

function normalizeATSAnalysis(value: unknown): ATSAnalysis {
  const record = asRecord(value);
  const sectionsRecord = asRecord(record?.sections);

  const sections = {
    keywords: normalizeAtsSection(
      sectionsRecord?.keywords,
      "Add stronger role-specific keywords and clearer outcome language."
    ),
    formatting: normalizeAtsSection(
      sectionsRecord?.formatting,
      "Improve clarity, consistency, and scannability across the layout."
    ),
    experience: normalizeAtsSection(
      sectionsRecord?.experience,
      "Show more measurable impact and stronger ownership signals."
    ),
    completeness: normalizeAtsSection(
      sectionsRecord?.completeness,
      "Fill missing sections so recruiters can evaluate the resume quickly."
    ),
  };

  const averageScore = Math.round(
    (sections.keywords.score +
      sections.formatting.score +
      sections.experience.score +
      sections.completeness.score) /
      4
  );

  const topSuggestions = asStringArray(record?.topSuggestions).slice(0, 5);

  return {
    overallScore: clamp(Math.round(asNumber(record?.overallScore, averageScore)), 0, 100),
    sections,
    topSuggestions:
      topSuggestions.length > 0
        ? topSuggestions
        : [
            "Add more role-specific keywords and clearer business-impact language.",
            "Strengthen bullets with measurable outcomes and ownership.",
            "Improve resume clarity so a recruiter can scan value quickly.",
          ],
    summary: asString(
      record?.summary,
      "The resume has a workable foundation, but it needs stronger positioning, clearer impact, and tighter keyword alignment."
    ),
  };
}

function normalizeInterviewQuestions(value: unknown): InterviewQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const record = asRecord(item);
      const options = asStringArray(record?.options);
      const correctAnswer = asString(record?.correctAnswer);
      const difficulty =
        record?.difficulty === "easy" ||
        record?.difficulty === "medium" ||
        record?.difficulty === "hard"
          ? record.difficulty
          : index < 2
            ? "easy"
            : index > 5
              ? "hard"
              : "medium";

      if (!asString(record?.question) || options.length < 2) {
        return null;
      }

      return {
        question: asString(record?.question),
        options: options.slice(0, 4),
        correctAnswer: correctAnswer || options[0],
        explanation: asString(
          record?.explanation,
          "Review the concept behind this answer and practice explaining it out loud."
        ),
        difficulty,
      } satisfies InterviewQuestion;
    })
    .filter((item): item is InterviewQuestion => Boolean(item))
    .slice(0, 8);
}

function normalizeInterviewPrepPlan(value: unknown, input: InterviewPrepInput): InterviewPrepPlan {
  const record = asRecord(value);
  const rawTopics = Array.isArray(record?.topics) ? record.topics : [];
  const rawTimeline = Array.isArray(record?.timeline) ? record.timeline : [];

  const topics = rawTopics
    .map((item) => {
      const topic = asRecord(item);
      const priority =
        topic?.priority === "high" || topic?.priority === "medium" || topic?.priority === "low"
          ? topic.priority
          : "medium";

      const title = asString(topic?.title);
      if (!title) return null;

      return {
        title,
        reason: asString(
          topic?.reason,
          "This is a high-leverage topic for the interview track you selected."
        ),
        priority,
      };
    })
    .filter(
      (
        item
      ): item is { title: string; reason: string; priority: "high" | "medium" | "low" } =>
        Boolean(item)
    )
    .slice(0, 6);

  const timeline = rawTimeline
    .map((item) => {
      const phase = asRecord(item);
      const label = asString(phase?.label);
      const focus = asString(phase?.focus);
      if (!label || !focus) return null;
      return { label, focus };
    })
    .filter((item): item is { label: string; focus: string } => Boolean(item))
    .slice(0, 4);

  const practiceQuestions = asStringArray(record?.practiceQuestions).slice(0, 6);
  const mockTasks = asStringArray(record?.mockTasks).slice(0, 5);

  return {
    summary: asString(
      record?.summary,
      `Focused ${input.level} ${input.role} plan centered on ${input.interviewType.replace("_", " ")} preparation.`
    ),
    topics:
      topics.length > 0
        ? topics
        : [
            {
              title: `${input.role} core fundamentals`,
              reason: "Build strong baseline confidence before moving into higher-pressure rounds.",
              priority: "high",
            },
            {
              title: `${input.interviewType.replace("_", " ")} pattern recognition`,
              reason: "Practice the problem shapes and answer styles most likely to appear.",
              priority: "high",
            },
            {
              title: "Storytelling and communication",
              reason: "Translate your thinking clearly so interviewers can follow your decisions.",
              priority: "medium",
            },
          ],
    practiceQuestions:
      practiceQuestions.length > 0
        ? practiceQuestions
        : [
            `What does strong performance look like for a ${input.role} candidate at the ${input.level} level?`,
            `How would you approach a representative ${input.interviewType.replace("_", " ")} round?`,
            "Which recent project best demonstrates your readiness, and why?",
          ],
    mockTasks:
      mockTasks.length > 0
        ? mockTasks
        : [
            "Run one timed mock session and summarize where you hesitated.",
            "Turn weak answers into sharper, repeatable response frameworks.",
            "Review one strong project story with impact, tradeoffs, and lessons learned.",
          ],
    timeline:
      timeline.length > 0
        ? timeline
        : [
            { label: "Week 1", focus: "Foundations and concept refresh" },
            { label: "Week 2", focus: "Guided practice with targeted drills" },
            { label: "Week 3", focus: "Mock interviews and feedback refinement" },
            { label: "Week 4", focus: "Final polish and confidence loops" },
          ],
  };
}

async function withTimeout<T>(promise: Promise<T>, label: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Please retry.`));
    }, AI_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function generateContent(
  prompt: string,
  options?: {
    json?: boolean;
    temperature?: number;
  }
) {
  if (!prompt.trim()) {
    throw new Error("Prompt is required.");
  }

  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      ...(options?.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  try {
    const response = await withTimeout(
      model.generateContent(prompt),
      "Gemini request"
    );
    const text = response.response.text().trim();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    console.error("[AI] Gemini request failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gemini request failed.");
  }
}

export async function generateText(prompt: string) {
  return generateContent(prompt);
}

export async function streamText(prompt: string) {
  if (!prompt.trim()) {
    throw new Error("Prompt is required.");
  }

  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: 0.7,
    },
  });

  try {
    const result = await withTimeout(
      model.generateContentStream(prompt),
      "Gemini stream"
    );
    return result.stream;
  } catch (error) {
    console.error("[AI] Gemini stream failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gemini stream failed.");
  }
}
export async function generateJSON<T>(prompt: string) {
  const rawText = await generateContent(prompt, { json: true, temperature: 0.1 });

  try {
    return tryParseJson<T>(rawText);
  } catch (error) {
    console.error("[AI] Invalid JSON response:", rawText, error);
  }

  const retryText = await generateContent(
    `${prompt}\n\nIMPORTANT: Return strictly valid JSON only. Do not include markdown, commentary, or code fences.`,
    { json: true, temperature: 0 }
  );

  try {
    return tryParseJson<T>(retryText);
  } catch (error) {
    console.error("[AI] Invalid JSON retry response:", retryText, error);
  }

  const repairText = await generateContent(
    `Convert the following malformed JSON into strict valid JSON only. Do not add commentary, markdown, or code fences.

Malformed JSON:
${retryText}`,
    { json: true, temperature: 0 }
  );

  try {
    return tryParseJson<T>(repairText);
  } catch (error) {
    console.error("[AI] Invalid JSON repair response:", repairText, error);
    throw new Error("Gemini returned invalid JSON.");
  }
}

export async function generateCareerMission(input: CareerMissionInput) {
  const prompt = `
You are an elite Career Executive Coach and Technical Recruiter.
A user wants to create a career mission to get hired.

User Profile / Goal:
- Target Role: ${input.role}
- Target Company: ${input.company || "Any top-tier company"}
- Experience Level: ${input.experience}
- Additional Context: ${input.description || "None"}

Generate a comprehensive, actionable mission plan in strict JSON.
Return exactly:
{
  "mission_title": "string",
  "mission_description": "string",
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "critical|high|medium|low",
      "due_in_days": 1
    }
  ]
}

Requirements:
- Provide 5 to 8 high-impact tasks.
- Make the tasks specific to the target role and company.
- Return only valid JSON.
`;

  try {
    const raw = await generateJSON<unknown>(prompt);
    return normalizeMissionPlan(raw, input);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn("[AI] Using mission fallback because Gemini quota is exceeded.");
      return buildMissionFallback(input);
    }
    throw error;
  }
}

export async function analyzeSkillGap(input: SkillGapInput) {
  const skills = normalizeList(input.skills);
  const prompt = `Analyze skill gaps for a professional targeting ${
    input.targetRole || "their next career move"
  } in ${input.industry || "technology"}.
Current experience: ${input.experience || "not specified"}.
Current skills: ${skills.join(", ") || "none listed"}.

Return ONLY JSON:
{
  "overallReadiness": <0-100>,
  "matched": ["skill1","skill2"],
  "missing": [
    {
      "skill": "name",
      "priority": "high|medium|low",
      "learningPath": "how to learn it"
    }
  ],
  "summary": "assessment"
}`;

  return generateJSON<SkillGapAnalysis>(prompt);
}

export async function optimizeResume(input: ResumeOptimizationInput) {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.
Analyze this resume and score it for the role ${input.targetRole || "not specified"} in ${
    input.industry || "technology"
  }.

Resume:
${input.content}

Return ONLY JSON:
{
  "overallScore": <0-100>,
  "sections": {
    "keywords": {
      "score": <0-100>,
      "found": ["kw1","kw2"],
      "missing": ["kw1","kw2"],
      "tip": "actionable tip"
    },
    "formatting": {
      "score": <0-100>,
      "found": [],
      "missing": ["issue"],
      "tip": "actionable tip"
    },
    "experience": {
      "score": <0-100>,
      "found": [],
      "missing": [],
      "tip": "actionable tip"
    },
    "completeness": {
      "score": <0-100>,
      "found": [],
      "missing": ["section"],
      "tip": "actionable tip"
    }
  },
  "topSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "summary": "2-3 sentence assessment"
}

Be realistic: average resumes score 50-65. Only excellent ones score 80+.
Return only valid JSON.`;

  try {
    const raw = await generateJSON<unknown>(prompt);
    return normalizeATSAnalysis(raw);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn("[AI] Using resume fallback because Gemini quota is exceeded.");
      return buildResumeFallback(input);
    }
    throw error;
  }
}

export async function generateInterviewQuestions(input: InterviewQuestionInput) {
  const skills = normalizeList(input.skills);
  const prompt = `Generate 10 interview questions for a ${
    input.role || input.industry || "technology"
  } professional with skills: ${skills.join(", ") || "none listed"}.
Experience level: ${input.level || "intermediate"}.
Interview focus: ${input.interviewType || "mixed"}.

Mix difficulties: 3 easy, 5 medium, 2 hard.

Return ONLY a JSON array:
[{
  "question": "question text",
  "options": ["A","B","C","D"],
  "correctAnswer": "exact matching option",
  "explanation": "why this is correct",
  "difficulty": "easy|medium|hard"
}]`;

  try {
    const raw = await generateJSON<unknown>(prompt);
    const normalized = normalizeInterviewQuestions(raw);

    return normalized.length > 0 ? normalized : buildInterviewQuestionFallback(input);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn("[AI] Using interview question fallback because Gemini quota is exceeded.");
      return buildInterviewQuestionFallback(input);
    }
    throw error;
  }
}

export async function generateInterviewPrepPlan(input: InterviewPrepInput) {
  const skills = normalizeList(input.skills);
  const prompt = `Create a personalized interview preparation plan in strict JSON.

Candidate context:
- Role: ${input.role}
- Level: ${input.level}
- Interview type: ${input.interviewType}
- Industry: ${input.industry || "technology"}
- Current skills: ${skills.join(", ") || "none listed"}

Return ONLY JSON:
{
  "summary": "string",
  "topics": [
    {
      "title": "string",
      "reason": "string",
      "priority": "high|medium|low"
    }
  ],
  "practiceQuestions": ["string"],
  "mockTasks": ["string"],
  "timeline": [
    {
      "label": "string",
      "focus": "string"
    }
  ]
}`;

  try {
    const raw = await generateJSON<unknown>(prompt);
    return normalizeInterviewPrepPlan(raw, input);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn("[AI] Using interview prep fallback because Gemini quota is exceeded.");
      return buildInterviewPrepPlanFallback(input);
    }
    throw error;
  }
}

export async function generateRoadmap(input: RoadmapInput) {
  const skills = normalizeList(input.skills);
  const prompt = `Create a 90-day career roadmap for someone targeting a ${
    input.role
  } role in ${input.industry || "technology"}.
Current skills: ${skills.join(", ") || "none listed"}.

Return ONLY JSON:
{
  "phases": [
    {
      "phase": 1,
      "title": "Foundation",
      "weeks": "1-3",
      "goals": ["goal1","goal2"],
      "milestones": ["milestone1"]
    },
    {
      "phase": 2,
      "title": "Building",
      "weeks": "4-6",
      "goals": ["goal1"],
      "milestones": ["milestone1"]
    },
    {
      "phase": 3,
      "title": "Applying",
      "weeks": "7-10",
      "goals": ["goal1"],
      "milestones": ["milestone1"]
    },
    {
      "phase": 4,
      "title": "Landing",
      "weeks": "11-13",
      "goals": ["goal1"],
      "milestones": ["milestone1"]
    }
  ],
  "summary": "overview"
}`;

  return generateJSON<CareerRoadmap>(prompt);
}

export async function generateDailyTasks(input: DailyTaskInput) {
  const prompt = `Generate 5 actionable daily tasks for someone pursuing this career mission:
Title: ${input.mission.title}
Description: ${input.mission.description}
Target Role: ${input.mission.target_role || "not specified"}
Industry: ${input.industry || "technology"}

Return ONLY a JSON array:
[{
  "title": "short task title",
  "description": "detailed actionable description",
  "priority": "high|medium|low"
}]`;

  return generateJSON<DailyTask[]>(prompt);
}

export async function generateMissionPlan(
  role: string,
  company: string,
  experience: string,
  description: string
) {
  return generateCareerMission({ role, company, experience, description });
}
