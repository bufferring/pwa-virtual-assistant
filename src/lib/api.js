const API_URL = 'https://unefa-asistente.duckdns.org/v1/chat/completions'

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
        max_tokens: 2048,
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
