export type Severity = 'critical' | 'warning' | 'good'

export const ANALYSIS_POOL: { severity: Severity; title: string; description: string }[] = [
  {
    severity: 'critical',
    title: 'SQL Injection vulnerability',
    description:
      'User input is concatenated directly into SQL queries with no parameterisation. An attacker can trivially exfiltrate or destroy the entire database.'
  },
  {
    severity: 'critical',
    title: 'Hardcoded credentials',
    description:
      'Passwords and API keys committed to source code are exposed to anyone with repo access and will inevitably end up in version history forever.'
  },
  {
    severity: 'critical',
    title: 'Synchronous blocking I/O',
    description:
      'Using sync AJAX or blocking reads freezes the event loop / thread, making the entire process unresponsive while waiting for network or disk.'
  },
  {
    severity: 'critical',
    title: 'Swallowed exceptions',
    description:
      'Bare `except: pass` or empty catch blocks silently discard errors, making debugging impossible and hiding real failures from operators.'
  },
  {
    severity: 'critical',
    title: 'Mutating state directly',
    description:
      'Directly mutating the existing state object breaks referential equality checks and makes state changes invisible to frameworks like React.'
  },
  {
    severity: 'critical',
    title: 'Dangerous eval usage',
    description:
      '`eval()` executes arbitrary strings as code, opening a wide-open remote code execution door if any part of the input is user-controlled.'
  },
  {
    severity: 'critical',
    title: 'Division by zero',
    description:
      'No guard against zero divisor. In Go this panics the entire goroutine; in other languages it silently produces Infinity or NaN.'
  },
  {
    severity: 'critical',
    title: 'Destructive command with no confirmation',
    description:
      '`rm -rf /` will wipe the entire filesystem. No dry-run flag, no confirmation prompt, no safety check of any kind.'
  },
  {
    severity: 'warning',
    title: 'Using `var` instead of `const`/`let`',
    description:
      '`var` is function-scoped and hoisted, leading to subtle bugs. Use `const` by default and `let` only when reassignment is truly needed.'
  },
  {
    severity: 'warning',
    title: 'Using `==` instead of `===`',
    description:
      'Loose equality coerces types in surprising ways (`0 == ""` is true). Always use strict equality to avoid hard-to-trace comparison bugs.'
  },
  {
    severity: 'warning',
    title: 'O(n²) bubble sort instead of built-in sort',
    description:
      'Hand-rolling a bubble sort when `Array.prototype.sort` exists wastes both lines of code and CPU cycles.'
  },
  {
    severity: 'warning',
    title: 'No error handling on fetch',
    description:
      '`fetch` only rejects on network failure — a 4xx or 5xx response still resolves. The status code must be checked explicitly.'
  },
  {
    severity: 'warning',
    title: 'Broad `any` types throughout',
    description:
      'Using `any` disables the entire TypeScript type system for those values. Define proper interfaces; that is literally the point of TypeScript.'
  },
  {
    severity: 'warning',
    title: 'Implicit `SELECT *`',
    description:
      'Selecting all columns adds unnecessary data transfer, breaks if columns are added/removed, and makes query intent completely opaque.'
  },
  {
    severity: 'warning',
    title: 'No timeout on HTTP request',
    description:
      'A request with no timeout can hang indefinitely, exhausting connection pools and making the service appear hung under slow network conditions.'
  },
  {
    severity: 'warning',
    title: 'TLS verification disabled',
    description:
      '`verify=False` silently disables certificate validation, opening the connection to man-in-the-middle attacks in production.'
  },
  {
    severity: 'warning',
    title: 'Legacy `.has_key()` method',
    description:
      '`.has_key()` was removed in Python 3. Use the `in` operator (`key in dict`) — it is both correct and more idiomatic.'
  },
  {
    severity: 'warning',
    title: 'Ignoring all errors with `_`',
    description:
      'Blanket error suppression with `_` hides every failure path. Even if you cannot handle an error, log it so it can be diagnosed.'
  },
  {
    severity: 'warning',
    title: 'Implicit string concatenation for SQL',
    description:
      'Building SQL via string interpolation is fragile even when not a security issue — whitespace, quoting, and encoding edge cases multiply quickly.'
  },
  {
    severity: 'good',
    title: 'Descriptive variable names',
    description:
      'Variables and functions are named after their purpose rather than their type. This is the cheapest form of documentation.'
  },
  {
    severity: 'good',
    title: 'Early return pattern',
    description:
      'Returning early on guard conditions keeps the happy path at the lowest indentation level, making the logic easier to follow.'
  },
  {
    severity: 'good',
    title: 'Single responsibility',
    description:
      'The function does one thing and is named after it. Easy to test, easy to replace, easy to reason about in isolation.'
  },
  {
    severity: 'good',
    title: 'Consistent code style',
    description:
      'Indentation, spacing, and casing are applied uniformly throughout the snippet, suggesting a formatter is in use.'
  },
  {
    severity: 'good',
    title: 'Basic error handling present',
    description:
      'There is at least a try/catch in place. The handling is incomplete, but the intent to deal with failures is there.'
  }
]
