/**
 * Client-side environment variables. This project uses Vite — only `VITE_*` names
 * are inlined into the client bundle; access via `import.meta.env`, never `process.env`.
 */
export function getOddsApiKey(): string | undefined {
  const key = import.meta.env.VITE_ODDS_API_KEY
  return typeof key === 'string' && key.length > 0 ? key : undefined
}
