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

## ⚠️ Known Issues & Development Status

> [!NOTE]
> **Studying Mechanics & UX Iteration**
> Active gameplay testing and polish are ongoing:
>
> 1. **Question Generation Updated**:
>    - Updated model resolution to use `gemini-3.6-flash` (with automated fallback to `gemini-3.5-flash` and domain templates).
>    - Procedural fallback questions now shuffle options to prevent the correct answer from always being option A.
> 2. **Powerup & Study Aid Checkpoint Alignment**:
>    - Dynamic labels in the exam modal now distinguish between unlocking passive powerups/upgrades and acquiring campus study aids (buildings).
>    - Upgrade cards in the store now correctly reflect affordability states (`cant-afford`), prevent premature accidental triggers, and properly update the unlock button with the specific item name.
> 3. **Ongoing Gameplay Balancing**:
>    - Pacing and frequency of exam checkpoints are being calibrated so active quizzing feels rewarding and harmonious alongside passive autoclicker accumulation.

---

## 🤝 Contributing & Agent Guidelines

Please refer to [`agents.md`](agents.md) for branch policies, PR requirements, and agent instructions.
