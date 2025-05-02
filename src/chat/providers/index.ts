import { Provider } from '../../common/types.js'
import { ChatProvider } from '../types.js'
import { createOpenAIProvider } from './openai.js'
import { createClaudeProvider } from './claude.js'
import { createAwsBedrockClaudeProvider } from './aws-bedrock-claude.js'

export function createProvider(provider: Provider, client: any): ChatProvider {
  switch (provider) {
    case Provider.OpenAI:
      return createOpenAIProvider(client)
    case Provider.Claude:
      return createClaudeProvider(client)
    case Provider.AwsBedrockClaude:
      return createAwsBedrockClaudeProvider(client)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
} 