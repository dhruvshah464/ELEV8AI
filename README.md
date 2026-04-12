<div align="center">

# K R I Y A · O S

**The Cosmic Execution Engine**

> *"Action is greater than inaction. Perform therefore thy task in life."*  
> — **Bhagavad Gita 3.8**

<br/>

**Next.js 15** · **React 19** · **TypeScript** · **Tailwind CSS** · **Framer Motion** · **Supabase** · **Google Gemini** · **Playwright**

---

</div>

## 🌌 System ArchitectureOverview

**KRIYA** is a production-grade, AI-powered career execution ecosystem. Designed for the modern operator, it bypasses the traditional, soulless SaaS dashboard paradigm in favor of a cinematic, philosophy-driven decision interface. 

To achieve massive scale and execution, the repository is **strictly bifurcated** into two symbiotic halves:

1. **KRIYA (The Frontend OS):** The psychological, strategic, and visual interface where decisions are made.
2. **Career-Ops (The Agentic Engine):** The ruthless backend automation machinery that executes on the real world.

---

## 🏛️ PART I: KRIYA — The Operating System

*The strategic command center. This is what you see, feel, and interact with.*

### What KRIYA Does
KRIYA acts as your cognitive layer. It is built to organize your career goals, manage your mental state during the job hunt, and provide a cinematic environment to formulate strategy.

- **Philosophical Modalities:** The UI physically transforms based on your current psychological need.
  - 🟡 **Krishna (Guidance):** Warm gold. Mentorship, learning, and finding direction out of chaos.
  - 🔵 **Vishnu (Order):** Sovereign blue. Structure, clarity, planning, and cosmic precision.
  - 🟣 **Shiva (Transformation):** Cosmic violet. Deep work, intensive execution, and the destruction of the false.
- **Cinematic Execution:** Targets 60 FPS motion-driven interactions using Framer Motion, Lenis smooth scrolling, and GPU-composited CSS particle systems to keep cognitive load low and engagement high.
- **Core SaaS Modules:**
  - `Command`: An Oracle-style conversational interface powered by Google Gemini.
  - `Clarity (Mission)`: Strategic mission building and long-term trajectory mapping.
  - `Action (Tasks)`: Sequential action execution with state-driven visual feedback.
  - `Signal (Resume)`: A laboratory interface mapping out your ATS-optimization metrics.
  - `Prepare (Interview)`: AI-generated simulation environments to test your edge.

---

## ⚙️ PART II: Career-Ops — The Agentic Engine

*The automated action layer. This is the terminal-driven backend that fights the war.*

### What Career-Ops Does
Career-Ops is an autonomous terminal and file-driven backend integrated into the KRIYA project. It operates like an autonomous agent, systematically dismantling the job-application funnel.

- **The Pipeline Manager:** You feed job URLs into the pipeline. Career-Ops queues them, reads them, and stages them for processing.
- **Deep Agentic Evaluation:** Powered by LLMs, it deeply analyzes job descriptions, grading them across 10 unique dimensions (giving an A–F score), and aligns them against distinct career archetypes.
- **Automated CV Compilation (PDF):** It utilizes Playwright headless browsers to autonomously generate pixel-perfect, highly tailored, ATS-compliant PDF resumes on-the-fly based on the evaluation data.
- **Portal Intelligence:** Features an automated scanning engine optimized for massive company portals (Greenhouse, Lever, Ashby, Workday, and 40+ customized enterprise platforms) to filter the signal from the noise.
- **The Tracker Database:** Maintains a local, git-ignored JSON intelligence database mapping the exact state, communications, and status of every single application in your pipeline.

---

## 🔗 The Bifurcation & Integration

Though bifurcated in logic, KRIYA and Career-Ops stream seamlessly together to form one ecosystem. KRIYA acts as the read/write visualizer for Career-Ops's raw data engines.

| User Intent in KRIYA | Career-Ops Execution | Data Interface |
| :--- | :--- | :--- |
| **"I want to apply here"** | Appends URL to processing queue | ⟷ `career-ops/data/pipeline.txt` |
| **"Should I take this job?"** | Runs LLM evaluation and generates report | ⟷ Reads `career-ops/reports/*.md` |
| **"Where do I stand?"** | Queries local JSON application datastore | ⟷ Syncs `career-ops/data/tracker.json` |
| **"Generate my resume"** | Triggers headless Playwright execution | ⟷ Spawns `generate_cv.js` output |

---

## 🛠️ Technical Stack & Infrastructure

| Layer | Technology |
|-------|-----------|
| **Core Framework** | Next.js 15 (App Router), React 19 |
| **Animation/Motion** | Framer Motion, custom CSS keyframes, Lenis |
| **Artificial Intelligence**| Google Gemini 2.5 API |
| **Database & Auth** | Supabase (PostgreSQL) + Row Level Security, OTP Auth |
| **Styling** | Tailwind CSS + custom Shadcn/UI integration |
| **Agentic Framework** | Claude Code / OpenCode (`career-ops`) |
| **Rendering Engine** | Playwright + HTML templating for PDF generation |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- A configured Supabase project
- Google AI Studio API key (Gemini)

### System Installation

```bash
# 1. Clone the repository
git clone https://github.com/dhruvshah464/ELEV8AI.git kriya
cd kriya

# 2. Install core dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local
# Edit .env.local with your Supabase and Gemini keys

# 4. Initialize Career-Ops engine (Optional but recommended)
cp career-ops/config/profile.example.yml career-ops/config/profile.yml
# Add your base markdown curriculum vitae to career-ops/cv.md

# 5. Launch the cosmic engine
npm run dev
```

Navigate to `http://localhost:3000` to enter the Command Interface.

### Environment Schema

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=your-database-url
GEMINI_API_KEY=your-gemini-key
CAREER_OPS_DIR=./career-ops
```

---

## 📂 Architectural Topology

```text
kriya/
├── app/
│   ├── (app)/               # Protected SaaS operating routes
│   │   ├── career/          # Binds UI to Career-Ops (pipeline, evaluate, tracker)
│   │   ├── dashboard/       # Command Interface (The Oracle)
│   │   ├── interview/       # AI Interview Preparation parameters
│   │   ├── mission/         # Clarity View implementation
│   │   ├── resume/          # Signal Lab componentry
│   │   └── tasks/           # Immediate Action Engine
│   ├── api/                 # Sub-graph API routing
│   └── (marketing)/         # Public-facing cinematic initiation sequence
├── career-ops/              # ⚙️ The Autonomous Application Agent (MIT base)
│   ├── modes/               # Sub-agent behavior definitions
│   ├── data/                # Data structures (pipelines, tracker - gitignored)
│   └── reports/             # Generated LLM analysis payload (gitignored)
├── lib/                     # Data clients, motion primitives, system utils
└── components/              # Atomic & complex React topologies
```

---

## ⚖️ Open Source Attribution

The fundamental framework for the `career-ops/` module draws architectural inspiration from [career-ops](https://github.com/santifer/career-ops) by Santiago Fernández de Valderrama. It is licensed under MIT. Modifications and integrations exist to bridge it natively into KRIYA OS.

---

<div align="center">
  <p><i>Built in India. For the world. For all time.</i></p>
  <p><b>"Lift yourself by your own efforts. You are your own friend, you are your own enemy."</b></p>
</div>
