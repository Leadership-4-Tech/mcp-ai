import { Provider } from '../common/types.js'

export type ChatRequest = {
  model: string
  messages: Array<{
    role: string
    content: string
    tool_calls?: any[]
  }>
  tools?: any[]
  tool_choice?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export type ChatResponse = {
  choices?: Array<{
    message: {
      content: string
      tool_calls?: any[]
    }
  }>
  tool_calls?: any[]
}

export interface ChatState {
  request: ChatRequest
  lastResponse: ChatResponse
}

export interface ChatIntegrator {
  sendMessage: (userInput: string) => Promise<string>
  disconnect: () => Promise<void>
}

export interface ChatProvider {
  createInitialRequest: (model: string, systemMessage: string, tools: any[]) => ChatRequest
  createContinuationRequest: (originalRequest: ChatRequest, lastResponse: ChatResponse, userInput: string) => ChatRequest
  extractContent: (response: ChatResponse) => string
  hasToolCalls: (response: ChatResponse) => boolean
  sendRequest: (request: ChatRequest) => Promise<ChatResponse>
} 