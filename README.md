# DC First Project

A Node.js web application built with Express and ES Modules, designed for local development and deployment on [Vercel](https://vercel.com).

---

## Project Structure

```text
├── api/
│   └── index.js        # Express app and Vercel serverless entrypoint
├── public/
│   ├── index.html      # Web frontend entrypoint
│   ├── style.css       # Application styling
│   └── app.js          # Client-side JavaScript
├── .gitignore          # Git ignore rules for Node & Vercel
├── agents.md           # Instructions and workflow rules for AI coding agents
├── package.json        # Project metadata, dependencies, and npm scripts
├── vercel.json         # Vercel routing configuration
└── README.md           # Project documentation
```

---

## Getting Started

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

## Deployment to Vercel

This project is configured out of the box for Vercel:

1. Push your branch to GitHub and create a Pull Request.
2. Link your repository in the [Vercel Dashboard](https://vercel.com/new).
3. Vercel automatically detects the Express serverless setup in `api/index.js` and serves static files from `public/`.

Or deploy via the Vercel CLI:

```bash
npx vercel
```

---

## Contributing & Agent Guidelines

Please refer to [`agents.md`](agents.md) for branch policies, PR requirements, and agent instructions.

