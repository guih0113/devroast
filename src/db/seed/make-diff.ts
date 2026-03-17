type DiffLine = { variant: 'added' | 'removed' | 'context'; code: string }

export function makeDiff(snippet: string): DiffLine[] {
  const lines = snippet.split('\n')
  const result: DiffLine[] = []

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const roll = Math.random()
    if (roll < 0.25) {
      result.push({ variant: 'removed', code: lines[i] })
      result.push({ variant: 'added', code: `${lines[i]} // fixed` })
    } else {
      result.push({ variant: 'context', code: lines[i] })
    }
  }

  return result
}
