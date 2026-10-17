export type OllamaMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '')
export const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b-it-qat'

type StreamOptions = {
  messages: OllamaMessage[]
  signal?: AbortSignal
  onToken: (token: string) => void
}

type OllamaChunk = {
  message?: { content?: string }
  error?: string
}

export async function streamOllamaChat({ messages, signal, onToken }: StreamOptions) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.85,
        repeat_penalty: 1.25,
        num_predict: 450,
      },
    }),
  })

  if (!response.ok) {
    let detail = `Ollama returned HTTP ${response.status}`
    try {
      const body = (await response.json()) as OllamaChunk
      if (body.error) detail = body.error
    } catch {
      // Keep the HTTP status when Ollama does not return JSON.
    }
    throw new Error(detail)
  }

  // Return one complete answer rather than appending streamed fragments. This
  // prevents duplicate-token rendering in React development mode and keeps the
  // answer easy to clean and validate before displaying it.
  const body = (await response.json()) as OllamaChunk
  if (body.error) throw new Error(body.error)
  if (body.message?.content) onToken(body.message.content)
}
