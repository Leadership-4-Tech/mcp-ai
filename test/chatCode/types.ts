import { McpTool } from '../../src/common/types.js'

export type BaseChatRequest = {
  model?: string
  messages: {
    role: string
    content: string | any[]
    tool_calls?: any[]
  }[]
  tools?: any[]
  tool_choice?: string | { type: string }
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export type ClaudeRequest = BaseChatRequest & {
  model: string
  system?: string
  max_tokens?: number
}

export type BedrockClaudeRequest = BaseChatRequest & {
  anthropic_version: string
  max_tokens: number
  system?: string
}

export type ChatRequest = ClaudeRequest | BedrockClaudeRequest

export type BaseChatResponse = {
  id?: string
  type?: string
  role?: string
  model?: string
  choices?: {
    message: {
      content: string | any[]
      tool_calls?: any[]
    }
  }[]
  content?: any[]
  stop_reason?: string
  stop_sequence?: string | null
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export type ChatResponse = BaseChatResponse

export interface ChatState {
  request: ChatRequest
  lastResponse: ChatResponse
  tools: readonly McpTool[]
}

export interface ChatIntegrator {
  sendMessage: (userInput: string) => Promise<string>
  disconnect: () => Promise<void>
}

export interface ChatProvider {
  createInitialRequest: (
    model: string,
    systemMessage: string,
    tools: any[]
  ) => ChatRequest
  createContinuationRequest: (
    originalRequest: ChatRequest,
    lastResponse: ChatResponse,
    userInput: string
  ) => ChatRequest
  extractContent: (response: ChatResponse) => string
  hasToolCalls: (response: ChatResponse) => boolean
  sendRequest: (request: ChatRequest) => Promise<ChatResponse>
}
