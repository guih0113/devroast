# diffs.com dependency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the @pierre/diffs dependency and update the pnpm lockfile.

**Architecture:** Update package.json to include the new dependency, then run pnpm install to update pnpm-lock.yaml. No code changes or runtime wiring required.

**Tech Stack:** pnpm, Node.js, Next.js

---

### Task 1: Add @pierre/diffs dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update dependencies list**

```json
  "dependencies": {
    "@ai-sdk/google": "^3.0.60",
    "@ai-sdk/groq": "^3.0.35",
    "@ai-sdk/openai": "^3.0.41",
    "@ai-sdk/rsc": "^2.0.153",
    "@base-ui-components/react": "1.0.0-rc.0",
    "@pierre/diffs": "^1.1.12",
    "@number-flow/react": "^0.6.0",
    "@tanstack/react-query": "^5.96.1",
    "@trpc/client": "^11.16.0",
    "@trpc/server": "^11.16.0",
    "@trpc/tanstack-react-query": "^11.16.0",
    "@vercel/og": "^0.11.1",
    "ai": "^6.0.116",
    "drizzle-orm": "^0.45.1",
    "hast-util-to-jsx-runtime": "^2.3.6",
    "highlight.js": "^11.11.1",
    "motion": "^12.38.0",
    "next": "16.1.6",
    "postgres": "^3.4.8",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "server-only": "^0.0.1",
    "shiki": "^4.0.2",
    "tailwind-merge": "^3.5.0",
    "tailwind-variants": "^3.2.2",
    "zod": "^4.3.6"
  }
```

### Task 2: Update pnpm lockfile

**Files:**
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install dependencies**

Run: `pnpm install`
Expected: `pnpm-lock.yaml` updated with @pierre/diffs entries.

### Task 3: Commit dependency update

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Commit changes**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add diffs.com viewer dependency"
```

Expected: New commit with the dependency update.

---

## Self-Review

- Spec coverage: Task 1 covers dependency addition, Task 2 covers install/lockfile update, Task 3 covers commit.
- Placeholder scan: No TODOs or vague steps present.
- Type consistency: Dependency version is consistent with spec.
