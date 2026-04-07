import Link from 'next/link'
import { Button } from './button'

type PaginationProps = {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  const prevUrl = `${baseUrl}?page=${currentPage - 1}`
  const nextUrl = `${baseUrl}?page=${currentPage + 1}`

  return (
    <div className="flex items-center gap-4">
      {isFirstPage ? (
        <Button variant="ghost" size="sm" disabled>
          ← Previous
        </Button>
      ) : (
        <Link href={prevUrl}>
          <Button variant="ghost" size="sm">
            ← Previous
          </Button>
        </Link>
      )}

      <span className="font-mono text-xs text-zinc-600">
        Page {currentPage} of {totalPages}
      </span>

      {isLastPage ? (
        <Button variant="ghost" size="sm" disabled>
          Next →
        </Button>
      ) : (
        <Link href={nextUrl}>
          <Button variant="ghost" size="sm">
            Next →
          </Button>
        </Link>
      )}
    </div>
  )
}
