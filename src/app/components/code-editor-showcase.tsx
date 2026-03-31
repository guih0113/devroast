'use client'

import { CodeEditor } from '@/components/ui/code-editor'

const SAMPLE_CODE = `function greet(name) {
  console.log('Hello, ' + name + '!')
}

greet('World')`

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

export function CodeEditorReadOnlyShowcase() {
  return (
    <CodeEditor.Root defaultValue={SAMPLE_CODE} language="javascript" readOnly>
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
