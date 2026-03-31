'use client'

import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type { BundledLanguage } from 'shiki'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'
import { useLanguageDetection } from '@/hooks/use-language-detection'
import { useShikiHighlighter } from '@/hooks/use-shiki-highlighter'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/lib/languages'

interface CodeEditorContextValue {
  code: string
  setCode: (code: string, source?: 'typing' | 'paste' | null) => void
  language: BundledLanguage
  languageValue: BundledLanguage | 'auto-detect'
  isAutoDetect: boolean
  setLanguage: (lang: BundledLanguage) => void
  setAutoDetect: () => void
  highlightedHtml: string
  isHighlighting: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  highlightRef: React.RefObject<HTMLDivElement | null>
  lineNumbersRef: React.RefObject<HTMLDivElement | null>
  handleScroll: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

const CodeEditorContext = createContext<CodeEditorContextValue | null>(null)

function useCodeEditorContext() {
  const ctx = useContext(CodeEditorContext)
  if (!ctx) throw new Error('CodeEditor components must be used within CodeEditor.Root')
  return ctx
}

function useCodeEditor(defaultValue: string, onChange?: (code: string) => void) {
  const [code, setCodeInternal] = useState(defaultValue)
  const [language, setLanguageInternal] = useState<BundledLanguage>('javascript')
  const [languageValue, setLanguageValue] = useState<BundledLanguage | 'auto-detect'>('auto-detect')
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [manualLanguage, setManualLanguage] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const lastInputRef = useRef<'typing' | 'paste' | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { scheduleHighlight, isReady } = useShikiHighlighter()
  const { detectLanguage } = useLanguageDetection()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const setCode = (newCode: string, source: 'typing' | 'paste' | null = null) => {
    if (source) lastInputRef.current = source
    setCodeInternal(newCode)
    onChange?.(newCode)
  }

  const setLanguage = (lang: BundledLanguage) => {
    setLanguageInternal(lang)
    setLanguageValue(lang)
    setManualLanguage(true)
  }

  const setAutoDetect = () => {
    setManualLanguage(false)
    setLanguageValue('auto-detect')
  }

  useEffect(() => {
    if (!manualLanguage) {
      const detected = code.trim() ? detectLanguage(code) : null
      if (detected) {
        setLanguageInternal(detected)
        setLanguageValue(detected)
      } else {
        setLanguageValue('auto-detect')
      }
    }
  }, [code, manualLanguage, detectLanguage])

  useEffect(() => {
    if (!isReady || !code.trim()) {
      setHighlightedHtml('')
      setIsHighlighting(false)
      return
    }

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }

    if (lastInputRef.current === 'typing') {
      setIsHighlighting(true)
      highlightTimerRef.current = setTimeout(() => {
        scheduleHighlight(
          code,
          language,
          (html) => {
            setHighlightedHtml(html)
            setIsHighlighting(false)
          },
          0
        )
      }, 0)
      return
    }

    if (lastInputRef.current === 'paste') {
      setIsHighlighting(true)
    }

    scheduleHighlight(
      code,
      language,
      (html) => {
        setHighlightedHtml(html)
        setIsHighlighting(false)
      },
      50
    )
  }, [code, language, isReady, scheduleHighlight])

  const handleScroll = () => {
    if (!textareaRef.current || !highlightRef.current || !lineNumbersRef.current) return

    const scrollTop = textareaRef.current.scrollTop
    const scrollLeft = textareaRef.current.scrollLeft

    highlightRef.current.scrollTop = scrollTop
    highlightRef.current.scrollLeft = scrollLeft
    lineNumbersRef.current.scrollTop = scrollTop

    // Add scrolling class to show scrollbar
    textareaRef.current.classList.add('scrolling')

    // Remove scrolling class after user stops scrolling
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
    }
    scrollTimerRef.current = setTimeout(() => {
      textareaRef.current?.classList.remove('scrolling')
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd, value } = textarea

    if (
      (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) ||
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Enter' ||
      e.key === 'Tab'
    ) {
      lastInputRef.current = 'typing'
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const spaces = '  '
      const newValue = value.substring(0, selectionStart) + spaces + value.substring(selectionEnd)
      setCode(newValue, 'typing')

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + spaces.length
      })
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const currentLine = value.substring(0, selectionStart).split('\n').pop() || ''
      const indent = currentLine.match(/^\s*/)?.[0] || ''

      const shouldIndentMore = currentLine.trim().endsWith('{')
      const newIndent = shouldIndentMore ? indent + '  ' : indent

      const newValue =
        value.substring(0, selectionStart) + '\n' + newIndent + value.substring(selectionEnd)
      setCode(newValue, 'typing')

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length
      })
      return
    }

    if (e.key === '}') {
      const currentLine = value.substring(0, selectionStart).split('\n').pop() || ''
      if (currentLine.trim() === '' && currentLine.length >= 2) {
        e.preventDefault()
        const dedented = currentLine.slice(0, -2)
        const lineStart = selectionStart - currentLine.length
        const newValue =
          value.substring(0, lineStart) + dedented + '}' + value.substring(selectionEnd)
        setCode(newValue, 'typing')

        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + dedented.length + 1
        })
        return
      }
    }
  }

  return {
    code,
    setCode,
    language,
    languageValue,
    isAutoDetect: !manualLanguage,
    setLanguage,
    setAutoDetect,
    highlightedHtml,
    isHighlighting,
    textareaRef,
    highlightRef,
    lineNumbersRef,
    handleScroll,
    handleKeyDown
  }
}

const rootVariants = tv({
  base: 'flex w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
  variants: {},
  defaultVariants: {}
})

interface RootProps
  extends Omit<ComponentProps<'div'>, 'onChange'>,
    VariantProps<typeof rootVariants> {
  defaultValue?: string
  onChange?: (code: string) => void
}

function Root({ className, defaultValue = '', onChange, children, ...props }: RootProps) {
  const editor = useCodeEditor(defaultValue, onChange)

  return (
    <CodeEditorContext.Provider
      value={{
        code: editor.code,
        setCode: editor.setCode,
        language: editor.language,
        languageValue: editor.languageValue,
        isAutoDetect: editor.isAutoDetect,
        setLanguage: editor.setLanguage,
        setAutoDetect: editor.setAutoDetect,
        highlightedHtml: editor.highlightedHtml,
        isHighlighting: editor.isHighlighting,
        textareaRef: editor.textareaRef,
        highlightRef: editor.highlightRef,
        lineNumbersRef: editor.lineNumbersRef,
        handleScroll: editor.handleScroll,
        handleKeyDown: editor.handleKeyDown
      }}
    >
      <div className={rootVariants({ className })} {...props}>
        {children}
      </div>
    </CodeEditorContext.Provider>
  )
}

const windowHeaderVariants = tv({
  base: 'flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3',
  variants: {},
  defaultVariants: {}
})

interface WindowHeaderProps
  extends ComponentProps<'div'>,
    VariantProps<typeof windowHeaderVariants> {}

function WindowHeader({ className, ...props }: WindowHeaderProps) {
  const { languageValue, setLanguage, setAutoDetect } = useCodeEditorContext()

  return (
    <div className={windowHeaderVariants({ className })} {...props}>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
      </div>
      <LanguageSelect
        value={languageValue}
        onChange={(lang) => {
          if (lang === 'auto-detect') {
            setAutoDetect()
            return
          }
          setLanguage(lang)
        }}
      />
    </div>
  )
}

const editorBodyVariants = tv({
  base: 'relative flex h-[320px] w-full overflow-hidden bg-zinc-900',
  variants: {},
  defaultVariants: {}
})

interface EditorBodyProps extends ComponentProps<'div'>, VariantProps<typeof editorBodyVariants> {}

function EditorBody({ className, children, ...props }: EditorBodyProps) {
  return (
    <div className={editorBodyVariants({ className })} {...props}>
      {children}
    </div>
  )
}

const lineNumbersVariants = tv({
  base: 'code-editor-line-numbers h-full shrink-0 overflow-hidden border-r border-zinc-800 bg-zinc-900 px-4 py-4 font-mono text-sm leading-[1.5] text-zinc-600',
  variants: {},
  defaultVariants: {}
})

interface LineNumbersProps
  extends ComponentProps<'div'>,
    VariantProps<typeof lineNumbersVariants> {}

function LineNumbers({ className, ...props }: LineNumbersProps) {
  const { code, lineNumbersRef } = useCodeEditorContext()
  const lineCount = code.split('\n').length
  const lineNumbersText = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'),
    [lineCount]
  )

  return (
    <div ref={lineNumbersRef} className={lineNumbersVariants({ className })} {...props}>
      <pre className="m-0 whitespace-pre">{lineNumbersText}</pre>
    </div>
  )
}

const highlightVariants = tv({
  base: 'code-editor-highlight pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-sm leading-[1.5]',
  variants: {},
  defaultVariants: {}
})

interface HighlightProps extends ComponentProps<'div'>, VariantProps<typeof highlightVariants> {}

function Highlight({ className, ...props }: HighlightProps) {
  const { highlightedHtml, highlightRef } = useCodeEditorContext()

  return (
    <div
      ref={highlightRef}
      className={highlightVariants({ className })}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: exception
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  )
}

const textareaVariants = tv({
  base: 'code-editor-textarea absolute inset-0 resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent px-4 py-4 font-mono text-sm leading-[1.5] text-transparent caret-zinc-100 outline-none',
  variants: {},
  defaultVariants: {}
})

interface TextareaProps extends ComponentProps<'textarea'>, VariantProps<typeof textareaVariants> {}

function Textarea({ className, ...props }: TextareaProps) {
  const { code, setCode, textareaRef, handleScroll, handleKeyDown } = useCodeEditorContext()

  return (
    <textarea
      ref={textareaRef}
      value={code}
      onChange={(e) => {
        const source = e.nativeEvent instanceof InputEvent ? e.nativeEvent.inputType : null
        const isPaste = source === 'insertFromPaste'
        setCode(e.target.value, isPaste ? 'paste' : 'typing')
      }}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      className={textareaVariants({ className })}
      {...props}
    />
  )
}

const languageSelectVariants = tv({
  base: 'cursor-pointer appearance-none rounded border border-zinc-700 bg-zinc-800 px-8 py-1 font-mono text-xs text-zinc-300 outline-none transition hover:border-zinc-600 focus:border-emerald-500',
  variants: {},
  defaultVariants: {}
})

interface LanguageSelectProps
  extends Omit<ComponentProps<'select'>, 'value' | 'onChange'>,
    VariantProps<typeof languageSelectVariants> {
  value: BundledLanguage | 'auto-detect'
  onChange: (lang: BundledLanguage | 'auto-detect') => void
}

function LanguageSelect({ className, value, onChange, ...props }: LanguageSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BundledLanguage | 'auto-detect')}
        className={languageSelectVariants({ className })}
        {...props}
      >
        <option value="auto-detect">Auto-detect</option>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-zinc-400">
        ▾
      </span>
    </div>
  )
}

export const CodeEditor = {
  Root,
  WindowHeader,
  EditorBody,
  LineNumbers,
  Highlight,
  Textarea,
  LanguageSelect
}
