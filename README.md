# Cram Clicker (Johns Hopkins University)

A Johns Hopkins-themed incremental Cookie Clicker-style web application built with Node.js, Express, and modern ES Modules, designed for local play and seamless deployment on [Vercel](https://vercel.com). Click the Hopkins Blue Jay mascot to acquire knowledge, recruit study aids across the Homewood campus, unlock academic achievements, and conquer finals!

---

## 🎮 Game Features

- **Hopkins Blue Jay Mascot**: Handcrafted vector SVG mascot styled with official JHU colors (Hopkins Heritage Blue `#002D72`, Jay Blue `#68ACE5`, and Gold `#F1BE48`).
- **Interactive Clicking**: Dynamic click squeeze animations, glowing aura pulses, and floating `+X` numbers.
- **Campus Store & Study Helpers**:
  - ☕ **Brody Café Drip Coffee**: +0.4 KPS (Knowledge Per Second)
  - 📇 **Anki Flashcard Deck**: +3.0 KPS
  - 🧑‍🏫 **TA Office Hours**: +22 KPS
  - 👥 **Brody Atrium Study Group**: +175 KPS
  - 📚 **MSE Stacks Deep Dive**: +950 KPS
  - 🏛️ **Gilman Bell Tower Focus**: +5,000 KPS
  - 🔬 **Bloomberg Lab Grant**: +28,000 KPS
  - 🏅 **Nobel Laureate Mentorship**: +160,000 KPS
- **Custom Study Topics & Scoping**: Create dedicated study sessions for any class or exam. Bound each session with explicit content scope, included/excluded subtopics, and difficulty level guidelines.
- **Tiered Exam Checkpoint Quizzes**: Upgrades are gated behind knowledge checkpoint questions tailored to your topic and scope:
  - *Tier 1 (Fundamentals)*: Core definitions, terminology, and baseline models (PaperMate InkJoy, Highlighters, Bird in Hand).
  - *Tier 2 (Application)*: Problem solving, mechanisms, and applying principles (FFC Swipes, Brody Pod Chair, Levering Tea, Crab Spirit).
  - *Tier 3 (Mastery)*: Advanced synthesis, edge cases, and comprehensive mastery (Stuce Hangout, D1 Lacrosse Stick).
- **Session Switcher & Persistence**: Seamlessly switch between multiple ongoing study sessions. Each topic tracks its own knowledge, helpers, upgrades, and statistics independently.
- **Question Generation Engine**: Powered by `POST /api/generate-question` supporting Gemini AI generation via `GEMINI_API_KEY` or rich offline procedural subject templates.
- **Audio Synthesis**: Zero-dependency sound effects powered by the Web Audio API (toggleable sound).
- **Academic Transcripts & Achievements**: Track total knowledge crammed, clicks, study time, and unlock milestone badges (e.g., *Freshman Orientation*, *Dean's List*, *Phi Beta Kappa*).
- **Autosave**: Automatic `localStorage` saving every 4 seconds and on page close.

---

## 📁 Project Structure

```text
├── api/
│   └── index.js        # Express app and Vercel serverless entrypoint
├── public/
│   ├── index.html      # Cram Clicker web interface
│   ├── style.css       # JHU-themed styling, animations, and responsive layout
│   ├── app.js          # Game loop, audio synthesizer, store logic, and state
│   └── johns_hopkins_blue_jays.svg # Official Hopkins Blue Jay mascot vector
├── .gitignore          # Git ignore rules for Node & Vercel
├── agents.md           # Branch policies and instructions for AI coding agents
├── package.json        # Project metadata, dependencies, and npm scripts
├── vercel.json         # Vercel routing configuration
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ or v20+ recommended)
- [npm](https://www.npmjs.com/)

### 2. Install Dependencies

```bash
npm install
```

### 3. Local Development

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment to Vercel

This project is configured out of the box for Vercel:

1. Push your branch to GitHub and create a Pull Request.
2. Link your repository in the [Vercel Dashboard](https://vercel.com/new).
3. Vercel automatically detects the Express serverless setup in `api/index.js` and serves static files from `public/`.

Or deploy via the Vercel CLI:

```bash
npx vercel
```

---

## ⚠️ Known Issues & Development Status

> [!WARNING]
> **Quizzing System Status: Heavily in flux / Messed Up**
> The current quizzing and exam checkpoint system is experiencing significant design, technical, and UX issues that are actively being reworked:
>
> 1. **Messed-Up Quizzing Integration**:
>    - Conflicting mechanics between "autoclickers" (buildings) and passive "upgrades": gating every single autoclicker purchase behind a quiz question causes friction, confusion with affordability states, and breaks traditional clicker game pacing.
>    - The thresholding between requiring knowledge to attempt a quiz vs taking a quiz to earn/unlock the item is inconsistent.
> 2. **Question Quality, Difficulty Curve, & Fallbacks**:
>    - Procedural fallback questions repeat frequently and lack true adaptive depth.
>    - The difficulty scaling (Tier 1 vs Tier 2 vs Tier 3) needs tighter calibration against user-specified course scope and bounds.
> 3. **Modal & UI Nesting Glitches**:
>    - Earlier versions had broken backdrop nesting (`#quizModal` and `#topicsModal` trapped inside `#statsModal`), and the active session switch button required restructuring into a pop-up menu.
> 4. **Progression Pacing**:
>    - Scaling factors and knowledge accumulation rates need rebalancing to properly align active study recall with campus building upgrades.

---

## 🤝 Contributing & Agent Guidelines

Please refer to [`agents.md`](agents.md) for branch policies, PR requirements, and agent instructions.
