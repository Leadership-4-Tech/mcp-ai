import { Provider } from '../../../src/common/types.js'
import { ChatProvider } from '../types.js'
import { McpIntegratorConfig } from '../../../src/common/types.js'

import { createOpenAIProvider } from './openai.js'
import { createClaudeProvider } from './claude.js'
import { createAwsBedrockClaudeProvider } from './aws-bedrock-claude.js'

export function createProvider(
  provider: Provider,
  client: any,
  config: McpIntegratorConfig
): ChatProvider {
  switch (provider) {
    case Provider.AwsBedrockClaude:
      return createAwsBedrockClaudeProvider(client, config)
    case Provider.Claude:
      return createClaudeProvider(client)
    case Provider.OpenAI:
      return createOpenAIProvider(client)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
