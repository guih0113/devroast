export type Verdict = {
  label: string
  color: 'accent-red' | 'accent-amber' | 'accent-green'
}

export function getVerdict(score: number): Verdict {
  if (score <= 3) return { label: 'needs_serious_help', color: 'accent-red' }
  if (score <= 5) return { label: 'pretty_bad', color: 'accent-amber' }
  if (score <= 7) return { label: 'could_be_worse', color: 'accent-amber' }
  return { label: 'not_terrible', color: 'accent-green' }
}
