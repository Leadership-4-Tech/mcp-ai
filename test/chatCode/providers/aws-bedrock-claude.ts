import { ChatProvider, ChatRequest, ChatResponse } from '../types.js'
import { AwsBedrockClaudeResponse } from '../../integrator/types.js'
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { McpIntegratorConfig } from '../../common/types.js'

export function createAwsBedrockClaudeProvider(
  client: any,
  config: McpIntegratorConfig
): ChatProvider {
  if (!config.modelId) {
    throw new Error('modelId is required for AWS Bedrock Claude provider')
  }

  return {
    createInitialRequest(
      model: string,
      systemMessage: string,
      tools: any[]
    ): ChatRequest {
      const request = {
        model,
        system: systemMessage,
        messages: [],
        tools,
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
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
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens:
          options.max_tokens !== undefined
            ? options.max_tokens
            : originalRequest.max_tokens || 4096,
        system: originalRequest.system,
        messages,
        tools: originalRequest.tools?.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema,
        })),
        tool_choice: { type: 'auto' },
        temperature:
          options.temperature !== undefined
            ? options.temperature
            : originalRequest.temperature,
        top_p:
          options.top_p !== undefined ? options.top_p : originalRequest.top_p,
      }
      return request
    },

    extractContent(response: ChatResponse): string {
      if (Array.isArray(response.content)) {
        const textBlocks = response.content.filter(
          block => block.type === 'text'
        )
        return textBlocks.map(block => block.text).join('\n')
      }
      // @ts-ignore
      return response.choices?.[0]?.message?.content ?? ''
    },

    hasToolCalls(response: ChatResponse): boolean {
      const bedrockResponse = response as AwsBedrockClaudeResponse
      return bedrockResponse.content.some(block => block.type === 'tool_use')
    },

    async sendRequest(request: ChatRequest): Promise<ChatResponse> {
      try {
        const command = new InvokeModelCommand({
          modelId: config.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(request),
        })
        const response = await client.send(command)
        return JSON.parse(new TextDecoder().decode(response.body))
      } catch (error) {
        console.error('Error sending request to AWS Bedrock:', error)
        throw error
      }
    },
  }
}
