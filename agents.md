# Agent Instructions

This repository is a **Node.js web application** designed for seamless deployment on **Vercel**. All AI coding agents working in this project must strictly adhere to the guidelines and workflows below.

---

## 1. Environment & Tooling

Always use **`npm`** for package management and script execution.

### Package Management
- **Install all dependencies**:
  ```bash
  npm install
  ```
- **Add a dependency**:
  ```bash
  npm install <package-name>
  ```
- **Add a development dependency**:
  ```bash
  npm install -D <package-name>
  ```
- **Remove a dependency**:
  ```bash
  npm uninstall <package-name>
  ```

### Running Scripts & Local Development
- **Start development server**:
  ```bash
  npm run dev
  ```
- **Run tests (when configured)**:
  ```bash
  npm test
  ```

---

## 2. Vercel Deployment & Architecture

- **Deployment Target**: [Vercel](https://vercel.com)
- **API & Serverless Entrypoint**: `api/index.js` acts as the Express entrypoint and serverless handler.
- **Frontend Static Assets**: Located in `public/`.
- **Routing**: Handled by `vercel.json` and Express.
- Ensure all new server endpoints and features are compatible with Vercel serverless function runtimes (stateless execution, appropriate timeouts, environment variable usage).

---

## 3. Git & Branching Workflow (Strictly Enforced)

1. **Never push directly to `main`**:
   - Pushing directly to the `main` branch is strictly prohibited.
2. **Use Feature / Task Branches**:
   - All changes, bug fixes, and features must be developed on a dedicated separate branch (e.g., `feature/...`, `fix/...`, or a designated user branch).
3. **Merge via Pull Requests**:
   - All changes must be integrated into `main` exclusively through a Pull Request (PR) after review and verification.
4. **Keep Branches Synchronized with `main`**:
   - If the working branch is behind `main`, **always update the current branch with the latest changes from `main`** before creating a PR or making further dependent changes:
     ```bash
     git fetch origin main
     git merge origin/main
     ```
     *(or `git rebase origin/main` if preferred by the user)*
5. **No Automatic Commits or Pushes**:
   - **Never run `git commit` or `git push` automatically.**
   - Only stage, commit, or push when the user explicitly instructs you to do so.

