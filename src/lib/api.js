export const API_BASE_URL = 'https://unefa-asistente.duckdns.org'
export const API_URL = API_BASE_URL + '/v1/chat/completions'
export const API_HEALTH_URL = API_BASE_URL + '/v1/models'

const SYSTEM_PROMPT_TOKENS = 80
const CONTEXT_LIMIT = 120_000
const MAX_OUTPUT = 2048
const CHARS_PER_TOKEN = 3.5

export function estimatePromptTokens(history, newText) {
  const historyChars = history.reduce((sum, m) => sum + (m.text?.length || 0), 0)
  const historyTokens = Math.ceil(historyChars / CHARS_PER_TOKEN)
  const newTokens = Math.ceil((newText?.length || 0) / CHARS_PER_TOKEN)
  return SYSTEM_PROMPT_TOKENS + historyTokens + newTokens + MAX_OUTPUT
}

export function estimateHistoryTokens(history) {
  const historyChars = history.reduce((sum, m) => sum + (m.text?.length || 0), 0)
  return Math.ceil(historyChars / CHARS_PER_TOKEN)
}

export function pruneHistory(history, newText) {
  let pruned = [...history]
  let prunedCount = 0
  while (estimatePromptTokens(pruned, newText) > CONTEXT_LIMIT && pruned.length >= 2) {
    pruned.shift()
    pruned.shift()
    prunedCount += 1
  }
  if (prunedCount > 0) {
    const total = estimatePromptTokens(pruned, newText)
    console.log(`[Context Guard] Pruned ${prunedCount} oldest pairs. Prompt: ~${total} tokens.`)
  }
  return pruned
}

export async function streamChat({ messages, onToken, onFirstToken, onDone, onError, signal }) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        model: 'default',
        messages,
        stream: false,
        max_tokens: MAX_OUTPUT,
      }),
      signal,
    })

    if (!response.ok) {
      onError('server', `HTTP ${response.status}: ${response.statusText}`)
      return
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (typeof content === 'string') {
      onFirstToken?.()
      onToken?.(content)
    }

    onDone?.()
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.()
      return
    }
    onError('network', err.message)
  }
}
