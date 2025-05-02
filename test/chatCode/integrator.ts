import { McpIntegratorConfig, Provider } from '../../src/common/types.js'
import { create as createIntegratorFeatures } from '../../src/integrator/features.js'

import { createProvider } from './providers/index.js'
import { ChatIntegrator, ChatState } from './types.js'

export function createChatIntegrator(
  config: McpIntegratorConfig,
  client: any
): Promise<ChatIntegrator> {
  // eslint-disable-next-line functional/no-let
  let state: ChatState | undefined
  // eslint-disable-next-line functional/no-let
  let provider: any

  const getModel = () => {
    if (config.model) {
      return config.model
    }
  }

  // eslint-disable-next-line functional/no-let
  let features: any

  const initialize = async (systemMessage = 'You are a helpful assistant.') => {
    features = await createIntegratorFeatures(config)
    await features.connect()

    const tools = await features.getTools()
    const formattedTools = features.formatToolsForProvider(tools)
    provider = createProvider(config.provider, client, config)

    state = {
      request: provider.createInitialRequest(
        getModel(),
        systemMessage,
        formattedTools
      ),
      lastResponse: {} as any,
      tools: [],
    }

    return integrator
  }

  const sendMessage = async (userInput: string) => {
    // eslint-disable-next-line functional/no-try-statements
    try {
      // Create initial request with user input
      const initialRequest = provider.createContinuationRequest(
        // @ts-ignore
        state.request,
        // @ts-ignore
        state.lastResponse,
        userInput
      )

      // Initialize variables for the conversation loop
      let currentRequest = initialRequest
      let accumulatedContent = ''
      let toolCallCount = 0
      const MAX_TOOL_CALLS = 10 // Prevent infinite loops

      // Main conversation loop
      while (toolCallCount < MAX_TOOL_CALLS) {
        // Send request to LLM
        const currentResponse = await provider.sendRequest(currentRequest)

        // Extract and accumulate content from this response
        const content = provider.extractContent(currentResponse)
        if (content) {
          accumulatedContent = accumulatedContent
            ? `${accumulatedContent}\n\n${content}`
            : content
        }

        // Check for tool calls
        if (provider.hasToolCalls(currentResponse)) {
          const calls = features.extractToolCalls(currentResponse)
          if (calls && calls.length > 0) {
            // Execute tool calls
            const callResponses = await features.executeToolCalls(calls)

            // Create new request with tool results
            currentRequest = features.createToolResponseRequest(
              currentRequest,
              currentResponse,
              callResponses
            )

            // Update state
            // @ts-ignore
            // eslint-disable-next-line functional/immutable-data, require-atomic-updates
            state.request = currentRequest
            // @ts-ignore
            // eslint-disable-next-line functional/immutable-data, require-atomic-updates
            state.lastResponse = currentResponse

            toolCallCount++
            continue
          }
        }

        // No more tool calls, we're done
        // @ts-ignore
        // eslint-disable-next-line functional/immutable-data, require-atomic-updates
        state.request = currentRequest
        // @ts-ignore
        // eslint-disable-next-line functional/immutable-data, require-atomic-updates
        state.lastResponse = currentResponse
        break
      }

      // Return accumulated content
      return accumulatedContent || "I'm sorry, I couldn't generate a response."
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error sending message:', errorMessage)
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
    disconnect,
  }

  return initialize()
}
