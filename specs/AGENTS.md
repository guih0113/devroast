# Specs — AGENTS.md

## Purpose

Specs are written **before implementation** to define what will be built. They serve as a contract
between the requester and the implementer (human or AI).

## File naming

`specs/<feature-name>.md` — kebab-case, matches the feature or component name.

## Required sections

### Overview

One paragraph explaining what this feature is and why it exists.

### Goals

Bullet list of what the feature must accomplish.

### Behavior

How the feature works — user interactions, state changes, edge cases.

## Optional sections (add when relevant)

| Section | When to include |
|---------|-----------------|
| UI | Visual elements, layout, variants |
| API | Endpoints, request/response shapes |
| Schema | Database tables, relations, indexes |
| Files | List of files to create or modify |
| To-Do List | Step-by-step implementation checklist |

## Guidelines

- Keep specs **concise** — only what's needed to implement correctly.
- Use tables and bullet lists over prose.
- Include code snippets only when they clarify intent (schemas, types, examples).
- Update the spec if requirements change during implementation.
