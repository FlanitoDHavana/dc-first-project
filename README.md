# Cram Clicker (Johns Hopkins University)

A Johns Hopkins-themed incremental Cookie Clicker-style web application built with Node.js, Express, and modern ES Modules, designed for local play and seamless deployment on [Vercel](https://vercel.com). Click the Hopkins Blue Jay mascot to acquire knowledge, recruit study aids across the Homewood campus, unlock academic achievements, and conquer finals!

**Live deployment:** [Cram Clicker on Vercel](https://temporary-zippy-squall-9d38pnh.vercel.app)

## 👥 Team & Creators

- David Molina Perez
- Samuel Joon-hwan Lee
- Benjamin Tongkumbunjong

## 🎯 Problem Addressed

Studying can become repetitive, passive, and difficult to sustain, especially when students are working through demanding coursework for long periods of time. This can lead to procrastination, distraction, and study sessions that consume time without producing meaningful progress.

We created Cram Clicker to address that problem for Johns Hopkins University students by turning studying into a stimulating and interactive experience. The app combines focused quiz checkpoints, progressive rewards, topic-specific sessions, and familiar campus-themed elements to help students stay engaged, build momentum, and study without losing focus.

---

## 🎮 Game Features

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
- **Question Generation Engine**: Powered by `POST /api/generate-question` utilizing Gemini AI (`gemini-3.6-flash` / `gemini-3.5-flash`) via `GEMINI_API_KEY` or rich offline procedural subject templates with randomized option order.
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
├── .env                # Local environment secrets (ignored by git)
├── .env.example        # Template for environment configuration
├── .gitignore          # Git ignore rules for Node & Vercel
├── agents.md           # Branch policies and instructions for AI coding agents
├── package.json        # Project metadata, dependencies, and npm scripts
├── vercel.json         # Vercel routing configuration
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+ or v22+ recommended; supports native `.env` loading via `process.loadEnvFile()`)
- [npm](https://www.npmjs.com/)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (Optional for Gemini AI)

To enable live AI question generation tailored to your course scope:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Set your key in `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
*(If no API key is provided, Cram Clicker will automatically use offline procedural question templates.)*

### 4. Local Development

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
3. Add `GEMINI_API_KEY` under **Project Settings > Environment Variables** on Vercel if using live AI question generation.
4. Vercel automatically detects the Express serverless setup in `api/index.js` and serves static files from `public/`.

Or deploy via the Vercel CLI:

```bash
npx vercel
```

---

## 📝 Development Interaction Log

Chronological record of all changes currently recorded in the repository:

- `d9b512a` (2026-09-10): Created the initial project.
- `3a67968` (2026-09-10): Added agent configuration for uv-based workflows.
- `78baade` (2026-09-17): Formatted the project as a Node.js web app for Vercel and updated agent guidance.
- `b1343c3` (2026-09-17): Merged the first feature branch into the main development history.
- `6f9abbb` (2026-09-17): Implemented the Cram Clicker game, Johns Hopkins Blue Jay mascot, study store, and README updates.
- `c784a5f` (2026-09-17): Added the official JHU logo, upright orbital upgrades, campus lore, and progression rebalance.
- `d461a41` (2026-09-17): Added study-session switching, autoclicker quiz gates, and quiz-system status updates.
- `fcdfa58` (2026-09-20): Fixed quiz scope adherence, UI glitches, and store-panel separation.
- `a73f900` (2026-09-20): Cleaned up README features and removed development-status notes.
- `fcf38b1` (2026-09-23): Merged the third feature branch into the main development history.
- `734e2bf` (2026-09-23): Updated quiz generation and the study interface.
- `c395b14` (2026-09-23): Added supported Gemini model fallback handling.
- `55fa11c` (2026-09-23): Prioritized Gemini 3 Flash Preview.
- `0320449` (2026-09-23): Switched the preferred model to Gemini 3.5 Flash Lite.

Operational notes:

- Verified `POST /api/generate-question` returns valid quiz JSON through both Gemini and the offline procedural fallback.
- Deployed the API and frontend to Vercel and verified the production endpoint returns HTTP `200`.
- Environment secrets are excluded from the repository; configure `GEMINI_API_KEY` through local `.env` files or Vercel environment variables.

---



## 🤝 Contributing & Agent Guidelines


Please refer to [`agents.md`](agents.md) for branch policies, PR requirements, and agent instructions.
