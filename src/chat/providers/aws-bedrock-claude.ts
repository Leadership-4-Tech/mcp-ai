import { ChatProvider, ChatRequest, ChatResponse } from '../types.js'
import { AwsBedrockClaudeResponse } from '../../integrator/types.js'

export function createAwsBedrockClaudeProvider(client: any): ChatProvider {
  return {
    createInitialRequest(model: string, systemMessage: string, tools: any[]): ChatRequest {
      return {
        model,
        messages: [
          { role: "system", content: systemMessage },
        ],
        tools,
        tool_choice: "auto"
      }
    },

    createContinuationRequest(originalRequest: ChatRequest, previousResponse: ChatResponse, userMessage: string, options: any = {}): ChatRequest {
      const messages = [...originalRequest.messages || []];
      
      if (previousResponse.choices?.[0]?.message) {
        const assistantMessage = {
          role: "assistant",
          content: previousResponse.choices[0].message.content,
          tool_calls: previousResponse.choices[0].message.tool_calls
        };
        messages.push(assistantMessage);
      }
      
      messages.push({
        role: "user",
        content: userMessage
      });

      return {
        model: options.model || originalRequest.model,
        tools: originalRequest.tools,
        messages,
        temperature: options.temperature !== undefined ? options.temperature : originalRequest.temperature,
        max_tokens: options.max_tokens !== undefined ? options.max_tokens : originalRequest.max_tokens,
        top_p: options.top_p !== undefined ? options.top_p : originalRequest.top_p,
        frequency_penalty: options.frequency_penalty !== undefined ? options.frequency_penalty : originalRequest.frequency_penalty,
        presence_penalty: options.presence_penalty !== undefined ? options.presence_penalty : originalRequest.presence_penalty,
        tool_choice: options.tool_choice || originalRequest.tool_choice
      };
    },

    extractContent(response: ChatResponse): string {
      return response.choices?.[0]?.message?.content ?? '';
    },

    hasToolCalls(response: ChatResponse): boolean {
      const bedrockResponse = response as AwsBedrockClaudeResponse;
      return bedrockResponse.content.some(block => block.type === 'tool_use');
    },

    async sendRequest(request: ChatRequest): Promise<ChatResponse> {
      return client.messages.create(request);
    }
  }
} 