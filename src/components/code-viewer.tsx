'use client'

import type { BundledLanguage } from 'shiki'
import { CodeEditor } from '@/components/ui/code-editor'

interface CodeViewerProps {
  code: string
  language: BundledLanguage
}

export function CodeViewer({ code, language }: CodeViewerProps) {
  return (
    <CodeEditor.Root defaultValue={code} language={language} readOnly>
      <CodeEditor.WindowHeader />
      <CodeEditor.EditorBody>
        <CodeEditor.LineNumbers />
        <CodeEditor.Highlight />
        <CodeEditor.Textarea />
      </CodeEditor.EditorBody>
    </CodeEditor.Root>
  )
}
