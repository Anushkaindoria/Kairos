export type OllamaMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const TRANSACTION_CATEGORIES = [
  'Food',
  'Shopping',
  'Subscriptions',
  'Transport',
  'Entertainment',
  'Health',
  'Rent & bills',
  'Investing',
  'Other',
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]

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

type CategorySuggestion = {
  category: TransactionCategory
  confidence: number
  reason: string
}

const categorySet = new Set<string>(TRANSACTION_CATEGORIES)

function parseCategorySuggestion(text: string): CategorySuggestion {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Ollama returned an invalid category suggestion.')

  const value = JSON.parse(text.slice(start, end + 1)) as Partial<CategorySuggestion>
  if (typeof value.category !== 'string' || !categorySet.has(value.category)) {
    throw new Error('Ollama returned an unsupported transaction category.')
  }

  return {
    category: value.category as TransactionCategory,
    confidence: typeof value.confidence === 'number' ? Math.max(0, Math.min(1, value.confidence)) : 0.5,
    reason: typeof value.reason === 'string' ? value.reason : 'Based on the transaction name.',
  }
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

export async function suggestTransactionCategory(
  name: string,
  amount: number,
  signal?: AbortSignal,
): Promise<CategorySuggestion> {
  let response = ''
  await streamOllamaChat({
    signal,
    messages: [
      {
        role: 'system',
        content: `You classify personal-finance expense transactions. Choose exactly one category from this list: ${TRANSACTION_CATEGORIES.join(', ')}. Return valid JSON only with this shape: {"category":"Food","confidence":0.95,"reason":"short reason"}. Never invent a category. Do not include Markdown or any text outside the JSON.`,
      },
      {
        role: 'user',
        content: JSON.stringify({ transaction_name: name, amount_inr: amount }),
      },
    ],
    onToken: (token) => {
      response += token
    },
  })

  return parseCategorySuggestion(response)
}
