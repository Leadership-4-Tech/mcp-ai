import { ChatProvider, ChatRequest, ChatResponse } from '../types.js'
import { ClaudeResponse } from '../../integrator/types.js'

export function createClaudeProvider(client: any): ChatProvider {
  return {
    createInitialRequest(
      model: string,
      systemMessage: string,
      tools: any[]
    ): ChatRequest {
      const request = {
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
        ],
        tools,
      }
      return request
    },

    createContinuationRequest(
      originalRequest: ChatRequest,
      previousResponse: ChatResponse,
      userMessage: string,
      options: any = {}
    ): ChatRequest {
      const messages = [...(originalRequest.messages || [])]

      if (previousResponse.choices?.[0]?.message) {
        const assistantMessage = {
          role: 'assistant',
          content: previousResponse.choices[0].message.content,
          tool_calls: previousResponse.choices[0].message.tool_calls,
        }
        // eslint-disable-next-line functional/immutable-data
        messages.push(assistantMessage)
      }

      // eslint-disable-next-line functional/immutable-data
      messages.push({
        role: 'user',
        content: userMessage,
      })

      const request = {
        model: options.model || originalRequest.model,
        system: originalRequest.system,
        tools: originalRequest.tools,
        messages,
        temperature:
          options.temperature !== undefined
            ? options.temperature
            : originalRequest.temperature,
        max_tokens:
          options.max_tokens !== undefined
            ? options.max_tokens
            : originalRequest.max_tokens || 8192,
        top_p:
          options.top_p !== undefined ? options.top_p : originalRequest.top_p,
        frequency_penalty:
          options.frequency_penalty !== undefined
            ? options.frequency_penalty
            : originalRequest.frequency_penalty,
        presence_penalty:
          options.presence_penalty !== undefined
            ? options.presence_penalty
            : originalRequest.presence_penalty,
        tool_choice: options.tool_choice || originalRequest.tool_choice,
      }
      return request
    },

    extractContent(response: ChatResponse): string {
      if (response.content) {
        return response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n')
      }
      // @ts-ignore
      return response.choices?.[0]?.message?.content ?? ''
    },

    hasToolCalls(response: ChatResponse): boolean {
      const claudeResponse = response as ClaudeResponse
      return claudeResponse.content.some(block => block.type === 'tool_use')
    },

    async sendRequest(request: ChatRequest): Promise<ChatResponse> {
      try {
        const response = await client.messages.create(request)
        return response
      } catch (error) {
        console.error('Error sending request to Claude:', error)
        throw error
      }
    },
  }
}
