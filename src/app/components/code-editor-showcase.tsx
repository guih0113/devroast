'use client'

import { CodeEditor } from '@/components/ui/code-editor'

const SAMPLE_CODE = `function roast(code) {
  const score = analyze(code)
  return score
}`

export function CodeEditorShowcase() {
  return (
    <CodeEditor.Root defaultValue={SAMPLE_CODE}>
      <CodeEditor.WindowHeader />
      <CodeEditor.EditorBody>
        <CodeEditor.LineNumbers />
        <div className="relative flex-1 overflow-hidden">
          <CodeEditor.Highlight />
          <CodeEditor.Textarea />
        </div>
      </CodeEditor.EditorBody>
    </CodeEditor.Root>
  )
}
