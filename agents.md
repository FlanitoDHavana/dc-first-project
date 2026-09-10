# Agent Instructions

This repository uses **`uv`** for all Python package management and script execution. Agents working in this project must follow the guidelines below.

---

## Python Tooling & Environment

Always use `uv` for Python development tasks. Do not invoke `pip` or bare `python` directly unless specifically instructed.

### 1. Package Management

- **Add a dependency**:
  ```bash
  uv add <package-name>
  ```
- **Add a development dependency**:
  ```bash
  uv add --dev <package-name>
  ```
- **Remove a dependency**:
  ```bash
  uv remove <package-name>
  ```
- **Sync dependencies / environment**:
  ```bash
  uv sync
  ```
- **Create or recreate virtualenv**:
  ```bash
  uv venv
  ```

### 2. Running Python Scripts & Tools

- **Run Python scripts**:
  ```bash
  uv run python <script.py>
  ```
  *(or `uv run <script.py>`)*
- **Run Python modules / CLI tools**:
  ```bash
  uv run pytest
  uv run ruff check .
  ```
- **Interactive Python session**:
  ```bash
  uv run python
  ```

---

## Agent Rules

1. **Never use `pip install` directly**: Always use `uv add` (or `uv pip install` if working within an ad-hoc environment).
2. **Never execute scripts with bare `python <file>`**: Always prefix execution with `uv run` to ensure execution within the proper project environment.
3. **Keep `pyproject.toml` and lockfiles consistent**: Rely on `uv` to maintain dependency resolution and lockfile updates.

