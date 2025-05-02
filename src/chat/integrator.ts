import { McpIntegratorConfig, Provider } from '../common/types.js'
import { createProvider } from './providers/index.js'
import { create as createIntegratorFeatures } from '../integrator/features.js'
import { ChatIntegrator, ChatState } from './types.js'

export function createChatIntegrator(config: McpIntegratorConfig, client: any): Promise<ChatIntegrator> {
  let state: ChatState = {
    request: {} as any,
    lastResponse: {} as any
  }

  const getDefaultModel = () => {
    switch (config.provider) {
      case Provider.OpenAI:
        return "gpt-4o-mini"
      case Provider.Claude:
        return "claude-3-sonnet-20240229"
      case Provider.AwsBedrockClaude:
        return "anthropic.claude-3-sonnet-20240229"
      default:
        return "gpt-4o-mini"
    }
  }

  let features: any
  let provider: any

  const initialize = async (systemMessage = "You are a helpful assistant.") => {
    features = await createIntegratorFeatures(config)
    await features.connect()
    
    const tools = await features.getTools(config.provider)
    provider = createProvider(config.provider, client)
    
    state.request = provider.createInitialRequest(
      getDefaultModel(),
      systemMessage,
      tools
    )
    
    return integrator
  }

  const sendMessage = async (userInput: string) => {
    try {
      const newRequest = provider.createContinuationRequest(
        state.request,
        state.lastResponse,
        userInput
      )
      
      const response = await provider.sendRequest(newRequest)
      
      if (provider.hasToolCalls(response)) {
        const calls = features.extractCalls(response)
        if (calls && calls.length > 0) {
          const callResponses = await features.executeCalls(calls)
          const requestWithTools = features.combineResults(newRequest, response, callResponses)
          const finalResponse = await provider.sendRequest(requestWithTools)
          
          state.request = requestWithTools
          state.lastResponse = finalResponse
          return provider.extractContent(finalResponse)
        }
      }
      
      state.request = newRequest
      state.lastResponse = response
      return provider.extractContent(response)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error("Error sending message:", errorMessage)
      return `Error: ${errorMessage}`
    }
  }

  const disconnect = async () => {
    if (features) {
      await features.disconnect()
    }
  }

  const integrator: ChatIntegrator = {
    sendMessage,
    disconnect
  }

  return initialize()
} 