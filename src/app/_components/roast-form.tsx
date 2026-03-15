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

export function RoastForm() {
  const router = useRouter()
  const [code, setCode] = useState(SAMPLE_CODE)
  const [roastMode, setRoastMode] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleRoast() {
    if (!code.trim() || loading) return
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
    <div className="mx-auto flex w-full max-w-[780px] flex-col">
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

      {/* Actions bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle
            defaultChecked={roastMode}
            onCheckedChange={(checked) => setRoastMode(checked)}
            label="roast code"
          />
          <span className="font-mono text-xs text-zinc-600">{'// maximum villainy enabled'}</span>
        </div>
        <Button variant="primary" size="md" onClick={handleRoast} disabled={loading}>
          {loading ? '$ roasting...' : '$ roast my code'}
        </Button>
      </div>
    </div>
  )
}
