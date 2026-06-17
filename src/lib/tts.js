const TTS_BASE_URL = import.meta.env?.VITE_TTS_BASE_URL || 'https://unefa-asistente.duckdns.org'

const progressMap = {}

let currentAudio = null
let currentId = null
let activeCallbacks = null
let loadTimeoutId = null
let chunkIdx = 0
let chunksRef = []

const synth = window.speechSynthesis

function splitIntoChunks(text, maxLen = 180) {
  const parts = text.split(/([.!?]+)/)
  const sentences = []
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i]
    const punct = parts[i + 1] || ''
    const combined = (sentence + punct).trim()
    if (combined) sentences.push(combined)
  }

  const finalChunks = []
  for (const sentence of sentences) {
    if (sentence.length <= maxLen) {
      finalChunks.push(sentence)
      continue
    }
    const commaParts = sentence.split(/,/)
    let current = ''
    for (const part of commaParts) {
      const withComma = current ? current + ',' + part : part
      if (withComma.length <= maxLen) {
        current = withComma
      } else {
        if (current) finalChunks.push(current.trim())
        current = part
      }
    }
    if (current) finalChunks.push(current.trim())
  }

  const chunks = []
  let currentChunk = ''
  for (const s of finalChunks) {
    const next = currentChunk ? currentChunk + ' ' + s : s
    if (next.length <= maxLen) {
      currentChunk = next
    } else {
      if (currentChunk) chunks.push(currentChunk)
      currentChunk = s
    }
  }
  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

function getBackendTTSUrl(text) {
  return `${TTS_BASE_URL}/tts?text=${encodeURIComponent(text)}`
}

function fallbackToSynth(id, textToSpeak, onEnd, onError) {
  if (!synth) {
    onError?.(new Error('No TTS available'))
    return
  }
  const utter = new SpeechSynthesisUtterance(textToSpeak)
  utter.lang = 'es-ES'
  utter.rate = 1.0
  utter.pitch = 1.0

  utter.onend = () => {
    progressMap[id] = 0
    onEnd?.()
  }

  utter.onerror = (e) => {
    if (e.error !== 'canceled') progressMap[id] = 0
    onError?.(e)
  }

  synth.cancel()
  synth.speak(utter)
}

export async function speak(id, text, { offset = 0, onStart, onEnd, onError } = {}) {
  if (!text) {
    onEnd?.()
    return
  }

  cancel()

  const chunks = splitIntoChunks(text)
  if (chunks.length === 0) {
    onEnd?.()
    return
  }

  let startChunkIdx = 0
  let accumulated = 0
  for (let i = 0; i < chunks.length; i++) {
    accumulated += chunks[i].length
    if (accumulated > offset) {
      startChunkIdx = i
      break
    }
  }

  chunkIdx = startChunkIdx
  chunksRef = chunks
  activeCallbacks = { onStart, onEnd, onError }

  const playNext = () => {
    if (chunkIdx >= chunks.length) {
      progressMap[id] = 0
      currentId = null
      chunksRef = []
      activeCallbacks = null
      console.log('[TTS] all chunks finished')
      onEnd?.()
      return
    }

    const chunk = chunks[chunkIdx]
    const url = getBackendTTSUrl(chunk)
    progressMap[id] = chunks.slice(0, chunkIdx).reduce((sum, c) => sum + c.length, 0)
    currentId = id

    console.log(`[TTS] loading chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} chars)`)

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    currentAudio = audio

    clearTimeout(loadTimeoutId)
    loadTimeoutId = setTimeout(() => {
      console.warn('[TTS] load timeout, using fallback')
      audio.oncanplaythrough = null
      audio.onended = null
      audio.onerror = null
      currentAudio = null
      const remaining = chunks.slice(chunkIdx).join(' ')
      fallbackToSynth(id, remaining, onEnd, onError)
    }, 8000)

    audio.oncanplaythrough = () => {
      clearTimeout(loadTimeoutId)
      loadTimeoutId = null
      console.log(`[TTS] chunk ${chunkIdx + 1} ready, playing...`)
      audio.play().catch((err) => {
        console.error('[TTS] play() failed:', err.name, err.message)
        if (err.name === 'NotAllowedError') {
          const remaining = chunks.slice(chunkIdx).join(' ')
          fallbackToSynth(id, remaining, onEnd, onError)
          return
        }
        progressMap[id] = 0
        currentId = null
        currentAudio = null
        const cb = activeCallbacks
        activeCallbacks = null
        cb?.onError?.(err)
      })
    }

    audio.onended = () => {
      clearTimeout(loadTimeoutId)
      loadTimeoutId = null
      if (!activeCallbacks) return
      console.log(`[TTS] chunk ${chunkIdx + 1} ended`)
      chunkIdx++
      playNext()
    }

    audio.onerror = (e) => {
      clearTimeout(loadTimeoutId)
      loadTimeoutId = null
      console.error('[TTS] audio error, using fallback')
      const remaining = chunks.slice(chunkIdx).join(' ')
      currentAudio = null
      fallbackToSynth(id, remaining, onEnd, onError)
    }

    audio.src = url
    audio.load()
  }

  onStart?.()
  playNext()
}

export function cancel() {
  clearTimeout(loadTimeoutId)
  loadTimeoutId = null
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.oncanplaythrough = null
    currentAudio.src = ''
    currentAudio = null
  }
  if (synth) synth.cancel()
  if (activeCallbacks) {
    const cb = activeCallbacks
    activeCallbacks = null
    cb?.onError?.({ error: 'canceled' })
  }
  currentId = null
  chunksRef = []
}

export function resetProgress(id) {
  delete progressMap[id]
}

export function getOffset(id) {
  return progressMap[id] || 0
}

export function isSpeaking() {
  return currentAudio !== null && !currentAudio.paused && !currentAudio.ended
}

export function isSupported() {
  return true
}
