'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/ui/code-editor'
import { Toggle } from '@/components/ui/toggle'

const SAMPLE_CODE = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion
  return total;
}`

const MAX_CODE_LENGTH = 5000

export function RoastForm() {
  const router = useRouter()
  const [code, setCode] = useState(SAMPLE_CODE)
  const [roastMode, setRoastMode] = useState(true)
  const [loading, setLoading] = useState(false)

  const isOverLimit = code.length > MAX_CODE_LENGTH

  async function handleRoast() {
    if (!code.trim() || loading || isOverLimit) return
    setLoading(true)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang: 'javascript', roastMode })
      })
      if (!res.ok) throw new Error('roast failed')
      const { id } = await res.json()
      router.push(`/results?id=${id}`)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <div className="relative">
        <CodeEditor.Root defaultValue={SAMPLE_CODE} onChange={setCode}>
          <CodeEditor.WindowHeader />
          <CodeEditor.EditorBody>
            <CodeEditor.LineNumbers />
            <div className="relative flex-1 overflow-hidden">
              <CodeEditor.Highlight />
              <CodeEditor.Textarea />
            </div>
          </CodeEditor.EditorBody>
        </CodeEditor.Root>
        <div className="pointer-events-none absolute right-4 bottom-4">
          <span className={`font-mono text-xs ${isOverLimit ? 'text-red-400' : 'text-zinc-600'}`}>
            {code.length}/{MAX_CODE_LENGTH}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle
            defaultChecked={roastMode}
            onCheckedChange={(checked) => setRoastMode(checked)}
            label="roast code"
          />
          <span className="font-mono text-xs text-zinc-600">{'// maximum villainy enabled'}</span>
        </div>
        <Button variant="primary" size="md" onClick={handleRoast} disabled={loading || isOverLimit}>
          {loading ? '$ roasting...' : '$ roast my code'}
        </Button>
      </div>
    </div>
  )
}
