# Code Editor

## Overview

The code editor provides a syntax-highlighted textarea with optional language selection. It
auto-detects language from the current code when no manual selection is made.

## Goals

- Allow users to paste or type code with syntax highlighting.
- Provide a language selector with an auto-detect state.
- Keep typing responsive while highlighting updates.

## Behavior

- Auto-detect is shown only when the editor is empty or the language cannot be detected.
- When language detection succeeds, the selector reflects the detected language.
- Selecting a language manually disables auto-detect until the user picks auto-detect again.
- Tab inserts two spaces.
- Enter preserves indentation, and indents further after `{`.
- Typing highlights immediately (no debounce delay).

## UI

- Window header includes a language dropdown with a caret icon to indicate more options.
- Line numbers are shown for each line in the textarea.
- Highlight layer mirrors scroll position with the textarea.

## Files

- `src/components/ui/code-editor.tsx`
- `src/hooks/use-language-detection.ts`
- `src/lib/languages.ts`
