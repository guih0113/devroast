'use client'

import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import type { BundledLanguage } from 'shiki'
import { detectLanguage } from '@/hooks/use-language-detection'
import { useShikiHighlighter } from '@/hooks/use-shiki-highlighter'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/lib/languages'

// ---------------------------------------------------------------------------
// Internal hook
// ---------------------------------------------------------------------------

type UseCodeEditorOptions = {
  defaultValue?: string
  onChange?: (code: string) => void
  onLanguageChange?: (lang: string) => void
}

function useCodeEditor({ defaultValue = '', onChange, onLanguageChange }: UseCodeEditorOptions) {
  const [code, setCode] = useState(defaultValue)
  const [language, setLanguage] = useState<BundledLanguage | 'plaintext'>('plaintext')
  const [isManualOverride, setIsManualOverride] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const { highlighterReady, highlight, scheduleHighlight } = useShikiHighlighter()

  // Boot: once Shiki is ready, run initial detection + highlight
  useEffect(() => {
    if (!highlighterReady) return
    const detected = detectLanguage(code)
    setLanguage(detected)
    highlight(code, detected).then(setHighlightedHtml)
    // intentionally runs only when highlighterReady flips to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighterReady])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      onChange?.(newCode)

      let activeLang: BundledLanguage | 'plaintext' = language
      if (!isManualOverride) {
        const detected = detectLanguage(newCode)
        setLanguage(detected)
        onLanguageChange?.(detected)
        activeLang = detected
      }

      scheduleHighlight(newCode, activeLang, setHighlightedHtml)
    },
    [language, isManualOverride, onChange, onLanguageChange, scheduleHighlight]
  )

  const handleLanguageSelect = useCallback(
    (lang: BundledLanguage) => {
      setLanguage(lang)
      setIsManualOverride(true)
      setIsPickerOpen(false)
      onLanguageChange?.(lang)
      scheduleHighlight(code, lang, setHighlightedHtml)
    },
    [code, onLanguageChange, scheduleHighlight]
  )

  // Sync highlight layer + line numbers scroll to textarea
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop
      highlightRef.current.scrollLeft = ta.scrollLeft
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = ta.scrollTop
    }
  }, [])

  // Keyboard shortcuts: Tab / Shift+Tab / Enter / }
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current
      if (!ta) return

      const { selectionStart: ss, selectionEnd: se, value } = ta

      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          // Dedent: remove up to 2 leading spaces on the current line
          const lineStart = value.lastIndexOf('\n', ss - 1) + 1
          const match = value.slice(lineStart).match(/^( {1,2})/)
          if (match) {
            const n = match[1].length
            const next = value.slice(0, lineStart) + value.slice(lineStart + n)
            ta.value = next
            ta.selectionStart = ta.selectionEnd = ss - n
            handleCodeChange(next)
          }
        } else {
          // Indent: insert 2 spaces at cursor
          const next = `${value.slice(0, ss)}  ${value.slice(se)}`
          ta.value = next
          ta.selectionStart = ta.selectionEnd = ss + 2
          handleCodeChange(next)
        }
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const lineStart = value.lastIndexOf('\n', ss - 1) + 1
        const currentLine = value.slice(lineStart, ss)
        const indent = currentLine.match(/^(\s*)/)?.[1] ?? ''
        const lastChar = currentLine.trimEnd().slice(-1)
        const extra = ['{', '[', '(', ':'].includes(lastChar) ? '  ' : ''
        const next = `${value.slice(0, ss)}\n${indent}${extra}${value.slice(se)}`
        ta.value = next
        ta.selectionStart = ta.selectionEnd = ss + 1 + indent.length + extra.length
        handleCodeChange(next)
        return
      }

      if (e.key === '}') {
        const lineStart = value.lastIndexOf('\n', ss - 1) + 1
        const lineContent = value.slice(lineStart, ss)
        if (/^\s+$/.test(lineContent) && lineContent.length >= 2) {
          e.preventDefault()
          const dedented = lineContent.slice(0, -2)
          const next = `${value.slice(0, lineStart)}${dedented}}${value.slice(se)}`
          ta.value = next
          ta.selectionStart = ta.selectionEnd = lineStart + dedented.length + 1
          handleCodeChange(next)
        }
      }
    },
    [handleCodeChange]
  )

  const lineCount = code.split('\n').length

  return {
    code,
    language,
    highlightedHtml,
    isPickerOpen,
    setIsPickerOpen,
    textareaRef,
    highlightRef,
    lineNumbersRef,
    lineCount,
    handleCodeChange,
    handleLanguageSelect,
    handleKeyDown,
    syncScroll
  }
}

// ---------------------------------------------------------------------------
// Context — shares hook state across the namespace sub-components
// ---------------------------------------------------------------------------

type CodeEditorContextValue = ReturnType<typeof useCodeEditor>

const CodeEditorContext = createContext<CodeEditorContextValue | null>(null)

function useCodeEditorContext() {
  const ctx = useContext(CodeEditorContext)
  if (!ctx) throw new Error('CodeEditor sub-components must be used inside <CodeEditor.Root>')
  return ctx
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

type RootProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  defaultValue?: string
  onChange?: (code: string) => void
  onLanguageChange?: (lang: string) => void
}

function Root({
  defaultValue,
  onChange,
  onLanguageChange,
  className,
  children,
  ...props
}: RootProps) {
  const state = useCodeEditor({ defaultValue, onChange, onLanguageChange })

  return (
    <CodeEditorContext.Provider value={state}>
      <div
        className={`flex flex-col border border-[#2A2A2A] bg-[#111111]${className ? ` ${className}` : ''}`}
        {...props}
      >
        {children}
      </div>
    </CodeEditorContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// WindowHeader — macOS dots + language picker button
// ---------------------------------------------------------------------------

function WindowHeader() {
  const { language, isPickerOpen, setIsPickerOpen, handleLanguageSelect } = useCodeEditorContext()
  const label = LANGUAGE_LABELS[language] ?? language

  return (
    <div className="relative flex h-10 shrink-0 items-center gap-3 border-[#2A2A2A] border-b px-4">
      <span className="size-[10px] rounded-full bg-red-500" />
      <span className="size-[10px] rounded-full bg-amber-500" />
      <span className="size-[10px] rounded-full bg-emerald-500" />
      <span className="flex-1" />

      {/* Language picker trigger */}
      <button
        type="button"
        onClick={() => setIsPickerOpen((v) => !v)}
        className="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs text-zinc-400 transition-colors hover:bg-[#2A2A2A] hover:text-zinc-200"
      >
        {label}
        <span className="text-[10px] text-zinc-600">▾</span>
      </button>

      {/* Dropdown */}
      {isPickerOpen && (
        <div className="absolute top-10 right-2 z-50 max-h-56 w-36 overflow-y-auto border border-[#2A2A2A] bg-[#0F0F0F] shadow-lg">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageSelect(lang)}
              className={`flex w-full items-center px-3 py-1.5 font-mono text-xs transition-colors hover:bg-[#2A2A2A] hover:text-zinc-100 ${
                lang === language ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {LANGUAGE_LABELS[lang] ?? lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EditorBody — fixed-height flex row; host for LineNumbers + content area
// ---------------------------------------------------------------------------

function EditorBody({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex overflow-hidden" style={{ height: 320 }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LineNumbers — scrolls in sync with the textarea
// ---------------------------------------------------------------------------

function LineNumbers() {
  const { lineCount, lineNumbersRef } = useCodeEditorContext()

  return (
    <div
      ref={lineNumbersRef}
      className="flex shrink-0 select-none flex-col overflow-hidden border-[#2A2A2A] border-r bg-[#0F0F0F] px-3 py-3"
      aria-hidden="true"
    >
      {Array.from({ length: lineCount }, (_, i) => (
        <span key={i} className="min-w-[20px] text-right font-mono text-xs text-zinc-600 leading-5">
          {i + 1}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Highlight — Shiki HTML rendered behind the transparent textarea
// ---------------------------------------------------------------------------

function Highlight() {
  const { highlightedHtml, highlightRef } = useCodeEditorContext()

  return (
    <div
      ref={highlightRef}
      className="code-editor-highlight pointer-events-none absolute inset-0 overflow-hidden px-4 py-3"
      aria-hidden="true"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted shiki output
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  )
}

// ---------------------------------------------------------------------------
// Textarea — captures input; transparent so highlight shows through
// ---------------------------------------------------------------------------

function Textarea() {
  const { code, textareaRef, handleCodeChange, handleKeyDown, syncScroll } = useCodeEditorContext()

  return (
    <textarea
      ref={textareaRef}
      value={code}
      onChange={(e) => handleCodeChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onScroll={syncScroll}
      className="absolute inset-0 z-10 w-full resize-none bg-transparent px-4 py-3 font-mono text-xs leading-5 outline-none"
      style={{ color: 'transparent', caretColor: '#e4e4e7', tabSize: 2 }}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      aria-label="Paste your code here"
    />
  )
}

// ---------------------------------------------------------------------------
// LanguageSelect — standalone language picker (for use outside WindowHeader)
// ---------------------------------------------------------------------------

function LanguageSelect() {
  const { language, isPickerOpen, setIsPickerOpen, handleLanguageSelect } = useCodeEditorContext()
  const label = LANGUAGE_LABELS[language] ?? language

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsPickerOpen((v) => !v)}
        className="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs text-zinc-400 transition-colors hover:bg-[#2A2A2A] hover:text-zinc-200"
      >
        {label}
        <span className="text-[10px] text-zinc-600">▾</span>
      </button>

      {isPickerOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 max-h-56 w-36 overflow-y-auto border border-[#2A2A2A] bg-[#0F0F0F] shadow-lg">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageSelect(lang)}
              className={`flex w-full items-center px-3 py-1.5 font-mono text-xs transition-colors hover:bg-[#2A2A2A] hover:text-zinc-100 ${
                lang === language ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {LANGUAGE_LABELS[lang] ?? lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Namespace export
// ---------------------------------------------------------------------------

export const CodeEditor = {
  Root,
  WindowHeader,
  EditorBody,
  LineNumbers,
  Highlight,
  Textarea,
  LanguageSelect
}
