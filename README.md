<div align="center">
  
  <img src="public/kriya-logo.png" alt="KRIYA Shield" width="120" style="margin-bottom: 24px; filter: drop-shadow(0 0 20px rgba(201,168,76,0.3));" />

  <h1 style="font-size: 3rem; font-weight: 200; letter-spacing: 0.1em; margin: 0;">K R I Y A</h1>
  <p style="font-family: monospace; letter-spacing: 0.3em; color: #C9A84C; margin-top: 10px; font-size: 0.8rem;">
    THE COSMIC EXECUTION ENGINE
  </p>

  <br />

  [![Next.js](https://img.shields.io/badge/Next_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React_19-000000?style=for-the-badge&logo=react&logoColor=4A9BD9)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript&logoColor=3178C6)](#)
  [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-000000?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-000000?style=for-the-badge&logo=framer&logoColor=white)](#)
  [![Supabase](https://img.shields.io/badge/Supabase-000000?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](#)

  <br />

<<<<<<< HEAD
[Deploy to Vercel](https://vercel.com/new) • [View Demo]() • [Report Issue](https://github.com/DevGoyalG/JobGeniusAI/issues)
=======
  <p style="font-size: 1.1rem; color: #9CA3AF; max-w-2xl text-center font-style: italic;">
    “Action is greater than inaction. Perform therefore thy task in life.”<br />
    <span style="font-size: 0.8rem; letter-spacing: 0.1em; color: #8B7635;">— BHAGAVAD GITA 3.8</span>
  </p>
>>>>>>> f8cee98 (KRIYA)

</div>

---

## 👁️ The Architecture of Action

**KRIYA** is a production-grade SaaS framework that rejects traditional data representation. Moving away from disjointed grids, white cards, and borders, KRIYA utilizes **typography-led design, spatial breathing room, and dynamic state dissolution**. 

It is built for the modern Arjuna: operators, engineers, and visionaries navigating complex professional battlefields. We replace the "dashboard" with an **Oracle Interface** and a sequenced **Action Engine**.

### 🏛️ Philosophical Design Tokens

The UI dynamically reacts and reshapes itself based on the intent of the user, rooted in triadic Indian philosophy:

*   **VISHNU LAYER (The Preserver):** Deep indigos, structured grids, calm geometry. Used in the `/knowledge` and `/clarity` views to optimize signal-to-noise ratio when analyzing data.
*   **SHIVA LAYER (The Transformer):** Void blacks, organic noise, crimson embers. Used in the `/transform` view and during state transitions. When tasks are destroyed (completed), they do not disappear—they dissolve into particles, mapped to the Shiva aesthetic.
*   **KARMA LAYER (The Action):** Saffron and Gold. Used exclusively in the `/action` queue to denote forward momentum and active execution.

---

## ⚙️ Core Technical Specifications

### ⚡ 60 FPS Cinematic Rendering
Achieving a completely stable 60 FPS on mid-range devices while running heavy visual effects:
*   **Zero-JS Backgrounds:** All particle systems, nebula glows, and celestial dust are computed via pure CSS `@keyframes`, eliminating React hydration and render cycle overhead.
*   **Static DOM Sacred Geometry:** The Sri Yantra and Chakra rings are aggressively optimized using `React.memo` with pre-computed trigonometric points to prevent scroll-linked repaints.
*   **GPU Composition:** Strict avoidance of real-time `filter: blur()` during scroll interpolation (Lenis). Transitions use `will-change: transform` directly pushed to the GPU compositor.

### 🧠 The Oracle Interface (`CommandInput`)
Traditional SaaS relies on sidebars and disjointed pages. KRIYA centralizes routing through an Oracle-style text interface. You declare your intent, and the intelligence engine routes you into the appropriate spatial view.

### 🔥 Shiva Dissolution Transitions (`<ShivaTransition />`)
State changes shouldn't "jump." We built custom Framer Motion variants that trigger morphological dissolution. Completing a task triggers an ember-scatter effect against a localized crimson vignette, emphasizing the permanent transformation of that data.

---

## 🌌 The 5 SaaS Modalities

1.  **`/dashboard` (Command Center):** The central nexus. Features the Oracle Input and the massive `<VishnuRing />` (a CSS-animated execution score visualizer). 
2.  **`/clarity`:** Replaces the messy backlog. A strict, 3-column, typography-led breakdown of **Options**, **Risks**, and **Actions**.
3.  **`/action`:** The Execution Engine. Strips away the to-do list for a vertical timeline timeline. Execute sequentially. 
4.  **`/transform`:** A split-screen diagnostic. Left: What has been destroyed (past obstacles). Right: What is being reborn (emerging capabilities). 
5.  **`/knowledge`:** The observation deck. Auto-generates "insights" and text-patterns dynamically based on what you have accomplished, rendered across Vishnu grids.

---

## 🛠️ Local Initiation

### Prerequisites
*   Node.js 18+
*   Supabase Account (for remote DB projection)

### Ignition Sequence

```bash
# 1. Clone the repository
git clone https://github.com/dhruvshah464/ELEV8AI.git kriya
cd kriya

# 2. Install dependencies (React 19 + Next.js 15)
npm install

# 3. Configure environment variables
# Duplicate .env.example to .env.local and populate Supabase keys
cp .env.example .env.local

# 4. Initiate the local server
npm run dev
```
Navigate to `http://localhost:3000` to enter the platform.

---

## 🧬 Repository Topography

```text
kriya/
├── app/
│   ├── (app)/               # Protected SaaS Routes (The Modalities)
│   │   ├── action/          # Karma Engine
│   │   ├── clarity/         # Vision / Risk assessment
│   │   ├── dashboard/       # Oracle Command
│   │   ├── knowledge/       # Vishnu Intelligence
│   │   └── transform/       # Shiva State Changes
│   └── (marketing)/         # The Cosmic Landing Experience
├── components/
│   ├── kriya/               # Sacred UI Primitives (VishnuRing, InsightBlock)
│   └── core/                # Performance layers (SmoothScroller, Particles)
└── lib/                     # Supabase & Utilities
```

<<<<<<< HEAD
### 💎 Core Subsystems:
- **Execution Engine**: A high-speed, status-aware task list that prioritizes high-leverage actions.
- **AI Mentor (Live Sync)**: A streaming intelligence layer that provides tactical guidance based on your mission state.
- **Signal Graph**: Real-time visualization of your "Hireability" metrics across industry relevance and execution consistency.

---

## 🎨 Design Philosophy: "Less, but better."

We've completely overhauled the UI/UX to deliver a professional-grade workspace:
- **Invisible UI**: Interfaces that disappear, leaving only your content and focus.
- **Glassmorphism 2.0**: Subtle, multi-layered blur surfaces that feel like physical objects.
- **Fluid Motion**: Powered by **Framer Motion** and **Lenis**, providing native-feel smooth scrolling and micro-interactions (hover-lifts, scale-clicks).
- **Typography-First**: Strict adherence to Inter-Tight with custom tracking for maximum readability on high-density displays.

---

## 🛠️ The Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19 |
| **Animation** | Framer Motion & Lenis (Smooth Scroll) |
| **Intelligence** | Google Gemini 1.5 Flash / Pro |
| **Database** | Supabase (PostgreSQL) + Drizzle ORM |
| **Styling** | Tailwind CSS (v4 ready) + Shadcn/UI |
| **Auth** | Supabase Auth (Unified Session Management) |

---

## 🚀 Getting Started

### Prerequisites:
- Node.js 18.x or higher
- A Google AI Studio API Key (for Gemini)
- A Supabase Project

### Installation:

1. **Clone & Enter**:
   ```bash
   git clone https://github.com/DevGoyalG/JobGeniusAI.git
   cd JobGeniusAI
   ```

2. **Environment Configuration**:
   Create a `.env.local` file with the following keys:
   ```env
   # Database & Auth (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key

   # AI Intelligence
   GEMINI_API_KEY=your_google_ai_key
   ```

3. **Deploy Locally**:
   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```

---

## 📐 Implementation Progress

> [!NOTE]
> Currently in **v0.5-beta (Redesign Phase)**. Core layout modules are stabilized.

- [x] **Global Smooth Scroll** (Lenis Integration)
- [x] **Glass Surface System** (Shared UI tokens)
- [x] **AI Mentor Sync** (Streaming responses)
- [x] **Execution Queue** (Priority task management)
- [ ] **Advanced Resume Intelligence** (v0.6)
- [ ] **Mission Analytics** (v0.7)

=======
>>>>>>> f8cee98 (KRIYA)
---

<div align="center">
  
  <p style="font-size: 1.2rem; letter-spacing: 0.2em; font-weight: 300;">"Lift yourself by your own efforts. You are your own friend, you are your own enemy."</p>
  <p style="font-size: 0.8rem; letter-spacing: 0.3em; color: #8B7635;">DESIGNED FOR EXCELLENCE</p>

</div>
