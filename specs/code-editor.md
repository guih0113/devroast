# Code Editor with Syntax Highlight — Feature Spec

## Overview

Replace the current raw `<textarea>` in `src/app/page.tsx` with a proper syntax-highlighted
editor that overlays highlighted HTML on top of an editable textarea. The user pastes (or types)
code, the language is detected automatically, and the correct grammar colors are applied in
real-time. A language selector lets the user override the auto-detected language.

---

## Research Summary

### 1. ray-so Editor (Reference Implementation)

**Source:** `app/(navigation)/(code)/components/Editor.tsx` + `HighlightedCode.tsx`

ray-so uses the **textarea-overlay pattern**:

- An invisible `<textarea>` sits on top (or behind) a `<div>` that renders the highlighted HTML.
- Both share the same font, size, line-height, and padding so they align pixel-perfectly.
- The `<textarea>` captures user input; the `<div>` renders the colored output.
- Syntax highlighting is done by **Shiki** (via `codeToHtml()`) running **client-side** inside a
  `useEffect`. The Shiki highlighter instance is stored in a Jotai atom (`highlighterAtom`) and
  created once on mount.
- Language is stored as state (`selectedLanguageAtom`). Auto-detection is **not** used by ray-so —
  the user selects it manually via a `LanguageControl` dropdown.
- Custom keyboard handling (Tab indent/dedent, Enter with auto-indent, `}` bracket dedent) is
  implemented directly in the textarea `onKeyDown`.

**Key insight:** No third-party editor library is used. The entire interaction surface is a plain
HTML `<textarea>` with a Shiki-powered highlight layer behind it.

---

### 2. Alternative Approaches Evaluated

#### A. textarea-overlay + Shiki (client-side) — **ray-so pattern**

| Criterion | Assessment |
|---|---|
| Stack fit | Excellent — project already ships `shiki@^4` |
| Bundle size | Shiki loads lazily; grammar files loaded on demand |
| SSR/RSC | Highlighting runs client-side (in `useEffect`), no SSR needed |
| Customisation | Full control over theming, fonts, Chrome frame |
| Complexity | Low — ~150 lines of custom code total |
| Auto-detection | Requires adding `shiki`'s `@shikijs/langs` + `guessLang()` or `lowlight.highlightAuto()` |

This pattern is **the right choice** for devroast. It mirrors exactly what the project already does
in `code-block.tsx` (server-side Shiki for the results page) and what ray-so does for the editor.

#### B. CodeMirror 6 (`@uiw/react-codemirror`)

| Criterion | Assessment |
|---|---|
| Stack fit | Works but requires `'use client'` and a React wrapper |
| Bundle size | ~200–400 KB min+gzip for a basic setup with one language |
| SSR/RSC | Not compatible — fully client-side, needs `dynamic()` with `ssr: false` |
| Customisation | Very powerful but fights against the project's existing macOS-window chrome |
| Auto-detection | Available via `@codemirror/language-data` + `guessLanguage` |
| Complexity | High — new styling system (CM6 themes) conflicts with Tailwind |

**Verdict:** Overkill for a paste-and-submit workflow. Designed for full IDE-like editing.

#### C. Monaco Editor (`@monaco-editor/react`)

| Criterion | Assessment |
|---|---|
| Bundle size | ~2 MB+ — unacceptable for a web app |
| SSR/RSC | Not compatible |
| Customisation | Difficult to match the existing design system |
| Auto-detection | Available |

**Verdict:** Ruled out immediately. Way too heavy.

#### D. Prism.js (`react-syntax-highlighter` / `prism-react-renderer`)

| Criterion | Assessment |
|---|---|
| Stack fit | Would introduce a second highlighter alongside Shiki |
| Bundle size | Smaller than CM6 but still adds ~80 KB |
| Auto-detection | Not built-in |

**Verdict:** No benefit over Shiki, which is already in the project.

#### E. lowlight (highlight.js-based) for auto-detection only

`lowlight.highlightAuto()` can detect the language of a code snippet with a confidence score.
This is a lightweight (37 common grammars = ~80 KB) option to **complement** the textarea-overlay
approach by providing language auto-detection. It can be used on the client inside a debounced
`useEffect` to guess the language, which is then fed to the Shiki highlighter.

Alternatively, Shiki v4 itself provides `@shikijs/langs` with a `guessLang()` utility — keeping
everything in a single dependency.

---

### 3. Conclusion

**Chosen approach: textarea-overlay pattern with Shiki (client-side) + Shiki language guessing
for auto-detection.**

Reasoning:
- `shiki` is already a project dependency (`^4.0.2`).
- The overlay pattern requires zero new dependencies.
- It aligns exactly with how ray-so implements its editor.
- It keeps full design control (macOS chrome, JetBrains Mono font, dark theme).
- Shiki v4 supports `guessLang()` for auto-detection without a second library.
- The existing `code-block.tsx` already demonstrates Shiki usage patterns in this codebase.

---

## Feature Specification

### Functional Requirements

1. **Editable area:** The user can type or paste any code snippet.
2. **Syntax highlighting:** As the user types/pastes, the code is highlighted with the correct
   grammar colors. Highlighting updates are debounced (~150 ms) to avoid blocking the UI.
3. **Auto language detection:** On each change (debounced), the editor guesses the language using
   Shiki's `guessLang()`. The detected language updates the language selector automatically. If
   confidence is low (below threshold), fall back to `plaintext` silently — no guess shown.
4. **Manual language override:** A dropdown/select above or beside the editor lets the user pick a
   language explicitly. Once the user picks manually, auto-detection is permanently suppressed for
   that session — it does not re-run even when the content changes.
5. **Line numbers:** Display line numbers in the gutter, synced with the textarea scroll.
6. **Preserve existing chrome:** The macOS-style window frame (red/amber/green dots) that wraps
   the editor in `page.tsx` must be preserved.
7. **Submit action:** Clicking the "Roast my code" button reads the textarea value and navigates
   to `/results`.

### Non-Functional Requirements

- **No new heavyweight dependencies.** Shiki is already installed. Language auto-detection uses
  Shiki's built-in utilities only.
- **`'use client'`:** The editor component must be a Client Component. It must be imported via
  `dynamic()` with `ssr: false` from `page.tsx` if the page remains a Server Component, or the
  page can be converted to a Client Component.
- **Accessible:** `<textarea>` must retain `aria-label`. Highlighted output is `aria-hidden`.
- **Fixed height with internal scroll.** The editor has a fixed height (e.g. `320px` / `h-80`).
  Content exceeding that scrolls inside the editor. The highlight layer and line numbers gutter
  scroll in sync with the textarea via a shared `onScroll` handler.
- **Responsive:** The editor fills its container width.
- **Keyboard shortcuts (all in MVP):** Tab indent, Shift+Tab dedent, Enter with auto-indent
  (preserves leading whitespace and adds one level after `{`, `[`, `(`, `:`), `}` smart-dedent.
- **Performance:** Shiki highlighter is instantiated once and reused (singleton/module-level
  ref). Grammar files load lazily per language.

### Supported Languages (initial set)

Auto-detection + manual selection covers at minimum:
`javascript`, `typescript`, `tsx`, `jsx`, `python`, `rust`, `go`, `java`, `c`, `cpp`,
`csharp`, `php`, `ruby`, `swift`, `kotlin`, `html`, `css`, `scss`, `json`, `yaml`,
`shell`, `sql`, `markdown`

---

## Component Design

### File: `src/components/ui/code-editor.tsx`

```
'use client'

export const CodeEditor = { Root, Textarea, Highlight, LineNumbers, LanguageSelect }
```

Follows the **namespace/composition pattern** used by `AnalysisCard` and `LeaderboardRow`.

#### Sub-components

| Sub-component | Element | Responsibility |
|---|---|---|
| `Root` | `div` | Positions textarea and highlight layer (relative, overflow hidden) |
| `Textarea` | `textarea` | Captures input; transparent background, same metrics as Highlight |
| `Highlight` | `div` | Renders `dangerouslySetInnerHTML` from Shiki; pointer-events none |
| `LineNumbers` | `div` | Renders numbered spans; synced to scroll |
| `LanguageSelect` | `button`+dropdown | Shows detected/selected language; opens picker |

The internal `useCodeEditor()` hook (not exported) manages:
- `code: string` — the current value
- `language: string` — current language id
- `detectedLanguage: string | null` — last auto-detected result
- `isManualOverride: boolean` — once `true`, auto-detection never runs again for that instance
- `highlightedHtml: string` — output from `codeToHtml()`
- `highlighterRef` — singleton Shiki highlighter

#### Props for the composed `<CodeEditor.Root>`

```ts
type CodeEditorProps = {
  defaultValue?: string
  onChange?: (code: string) => void
  onLanguageChange?: (lang: string) => void
  className?: string
}
```

### File: `src/app/page.tsx` integration

Replace the inline `<textarea>` + manual line-numbers block with:

```tsx
import dynamic from 'next/dynamic'

const CodeEditor = dynamic(
  () => import('@/components/ui/code-editor').then(m => m.CodeEditor),
  { ssr: false }
)

// inside JSX:
<CodeEditor.Root defaultValue={SAMPLE_CODE} onChange={setCode}>
  <CodeEditor.LineNumbers />
  <CodeEditor.Highlight />
  <CodeEditor.Textarea />
  <CodeEditor.LanguageSelect />
</CodeEditor.Root>
```

---

## Technical Implementation Notes

### Shiki singleton

```ts
// module-level, shared across renders
let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [],  // loaded lazily
    })
  }
  return highlighterPromise
}
```

### Highlight update flow

```
user types → debounce 150ms
  → if !isManualOverride:
      guessLang(code) → if confidence >= threshold → detectedLanguage = lang
                      → if confidence <  threshold → detectedLanguage = 'plaintext'
  → highlighter.loadLanguage(activeLang) if not already loaded
  → highlighter.codeToHtml(code, { lang: activeLang, theme: 'github-dark' }) → setHighlightedHtml
```

`activeLang` = `manualLanguage` if `isManualOverride`, else `detectedLanguage`.

### Textarea / Highlight alignment

Both elements must share identical CSS:
```css
font-family: 'JetBrains Mono', monospace;
font-size: 0.75rem;   /* text-xs */
line-height: 1.25rem; /* leading-5 */
padding: 0.75rem 1rem;
white-space: pre;
tab-size: 2;
```

The `<textarea>` has `color: transparent` (or `opacity: 0` with `caret-color: white`) so only
the highlight layer is visible, while the cursor and selection still work naturally.

### Scroll sync

```ts
const textareaRef = useRef<HTMLTextAreaElement>(null)
const highlightRef = useRef<HTMLDivElement>(null)

// on textarea scroll:
highlightRef.current.scrollTop = textareaRef.current.scrollTop
highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
```

### Language selector UI

Minimal: a small `<button>` in the top-right corner of the editor chrome showing the detected
language name (e.g. "TypeScript"). Clicking opens a `@base-ui-components/react` `Popover` or
`Select` with the supported languages list. Matches the existing `Toggle`/`Button` design tokens.

---

## Decisions (answered)

| # | Question | Decision |
|---|---|---|
| 1 | Theme | `github-dark` — same as `code-block.tsx`. No theme switching in MVP. |
| 2 | Low-confidence detection | Fall back to `plaintext` silently. |
| 3 | Editor height | Fixed height with internal scroll (e.g. `320px`). |
| 4 | Manual override persistence | Once manually set, auto-detection never re-runs — no "auto" reset button. |
| 5 | Keyboard shortcuts | All in MVP: Tab indent, Shift+Tab dedent, Enter auto-indent, `}` smart-dedent. |

---

## Implementation To-Do List

- [ ] Create `src/components/ui/code-editor.tsx` with the namespace composition pattern
- [ ] Implement `useCodeEditor()` internal hook (state, Shiki singleton, debounce)
- [ ] Implement `CodeEditor.Root` — relative container with scroll sync
- [ ] Implement `CodeEditor.Textarea` — transparent textarea capturing input
- [ ] Implement `CodeEditor.Highlight` — `dangerouslySetInnerHTML` from Shiki output
- [ ] Implement `CodeEditor.LineNumbers` — gutter synced to scroll
- [ ] Implement `CodeEditor.LanguageSelect` — button + popover/dropdown picker
- [ ] Wire auto-detection: debounced `guessLang()` → update `detectedLanguage`
- [ ] Wire manual override: user pick → `isManualOverride = true`
- [ ] Implement Tab / Shift+Tab keyboard handling in `onKeyDown`
- [ ] Implement Enter with auto-indent in `onKeyDown`
- [ ] Integrate into `src/app/page.tsx` via `dynamic()` import
- [ ] Remove the old inline `<textarea>` + manual line numbers from `page.tsx`
- [ ] Verify alignment between textarea and highlight layer across browsers
- [ ] Add `aria-label` to textarea, `aria-hidden` to highlight layer
- [ ] Test with the supported language list (JS, TS, TSX, Python, Rust, Go, etc.)
- [ ] Test auto-detection with ambiguous snippets and edge cases
- [ ] Add the component to `src/app/components/page.tsx` (component showcase)
