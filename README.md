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
- **Study Upgrades**: One-time multipliers (PaperMate InkJoy gel pens, neon highlighters, Bird in Hand espresso, FFC unlimited swipes, Brody pod chairs, Levering peach tea rush, Maryland crab spirit, Stuce midnight hangout, and championship lacrosse sticks).
- **Audio Synthesis**: Zero-dependency sound effects powered by the Web Audio API (toggleable sound).
- **Academic Transcripts & Achievements**: Track total knowledge crammed, clicks, study time, and unlock milestone badges (e.g., *Freshman Orientation*, *Dean's List*, *Phi Beta Kappa*).
- **Autosave**: Automatic `localStorage` saving every 5 seconds and on page close.

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

## 🤝 Contributing & Agent Guidelines

Please refer to [`agents.md`](agents.md) for branch policies, PR requirements, and agent instructions.
