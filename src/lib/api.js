export const API_URL = 'https://unefa-asistente.duckdns.org/v1/chat/completions'

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
  let finished = false
  let firstToken = true
  let tokenCount = 0
  let finishReason = null

  const processLine = (line) => {
    if (!line.startsWith('data: ')) return
    const data = line.slice(6).trim()
    if (data === '[DONE]') {
      finished = true
      console.log('[SSE] done | tokens:', tokenCount, '| finish_reason:', finishReason || 'none')
      onDone()
      return
    }
    try {
      const chunk = JSON.parse(data)
      const content = chunk.choices?.[0]?.delta?.content
      const reason = chunk.choices?.[0]?.finish_reason
      if (reason) {
        finishReason = reason
        console.log('[SSE] finish_reason:', reason)
      }
      if (typeof content === 'string') {
        if (firstToken) {
          onFirstToken()
          firstToken = false
        }
        onToken(content)
        tokenCount++
      }
    } catch {
      // skip malformed chunk
    }
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        model: 'gemma-3-1b-it-Q4_K_M.gguf',
        messages,
        stream: true,
        max_tokens: MAX_OUTPUT,
      }),
      signal,
    })

    if (!response.ok) {
      onError('server', `HTTP ${response.status}: ${response.statusText}`)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        buffer += decoder.decode()
        if (buffer) {
          const lines = buffer.split('\n')
          for (const line of lines) {
            processLine(line.trim())
            if (finished) return
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        processLine(line.trim())
        if (finished) return
      }
    }

    if (!finished) {
      console.log('[SSE] ended without [DONE] | tokens:', tokenCount)
      onDone()
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      if (!finished) onDone()
      return
    }
    onError('network', err.message)
  }
}
