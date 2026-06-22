export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://unefa-asistente.duckdns.org'
export const API_URL = API_BASE_URL + '/v1/chat/completions'
export const API_HEALTH_URL = API_BASE_URL + '/v1/health'

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

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

/**
 * Streaming SSE real: parsea el formato OpenAI SSE token por token.
 * Formato: `data: {"choices":[{"delta":{"content":"token"}}]}\n\n`
 * Final:   `data: [DONE]\n\n`
 */
export async function streamChat({ messages, onToken, onFirstToken, onDone, onError, signal }) {
  const decoder = new TextDecoder()
  let buffer = ''
  let firstTokenFired = false

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        stream: true,
        max_tokens: MAX_OUTPUT,
        temperature: 0.4,
      }),
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText)
      onError('server', `HTTP ${response.status}: ${errText.slice(0, 200)}`)
      return
    }

    const reader = response.body.getReader()

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Procesar línea por línea
      const lines = buffer.split('\n')
      // El último elemento puede estar incompleto, lo dejamos en el buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (!trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()

        // Fin del stream
        if (payload === '[DONE]') {
          onDone?.()
          return
        }

        try {
          const json = JSON.parse(payload)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            if (!firstTokenFired) {
              firstTokenFired = true
              onFirstToken?.()
            }
            onToken?.(delta)
          }
        } catch (e) {
          // Línea JSON inválida, ignorar
          console.warn('[SSE] parse error:', payload.slice(0, 80))
        }
      }
    }

    // Si el stream terminó sin [DONE] explícito
    onDone?.()
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.()
      return
    }
    onError('network', err.message)
  }
}
