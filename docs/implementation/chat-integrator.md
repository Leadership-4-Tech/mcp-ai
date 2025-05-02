# Draft Implementation Plan: Multi-Provider Chat Integrator

## Current Issues

1. The current `testChatIntegrator.mts` script is hardcoded to work with OpenAI only.
2. Provider-specific logic is embedded directly in the script.
3. The script has TypeScript linter errors related to type definitions.
4. No abstraction for handling different provider response formats and continuation requests.

## Proposed Changes

### 1. Define Types

```typescript
// src/chat/types.ts
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

export type ChatProvider = {
  createInitialRequest: (model: string, systemMessage: string, tools: any[]) => ChatRequest
  createContinuationRequest: (originalRequest: ChatRequest, previousResponse: ChatResponse, userMessage: string, options?: any) => ChatRequest
  extractContent: (response: ChatResponse) => string
  hasToolCalls: (response: ChatResponse) => boolean
  sendRequest: (request: ChatRequest) => Promise<ChatResponse>
}

export type ChatState = {
  request: ChatRequest
  lastResponse: ChatResponse
}

export type ChatIntegrator = {
  sendMessage: (userInput: string) => Promise<string>
  disconnect: () => Promise<void>
}
```

### 2. Create Provider Functions

```typescript
// src/chat/providers/openai.ts
import { ChatProvider, ChatRequest, ChatResponse } from '../types.js'

export function createOpenAIProvider(client: any): ChatProvider {
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
      
      if (previousResponse.choices && previousResponse.choices.length > 0) {
        const assistantMessage = previousResponse.choices[0].message;
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
      return response.choices?.[0]?.message?.content || '';
    },

    hasToolCalls(response: ChatResponse): boolean {
      return response.choices?.[0]?.message?.tool_calls?.length > 0;
    },

    async sendRequest(request: ChatRequest): Promise<ChatResponse> {
      return client.chat.completions.create(request);
    }
  }
}

// Similar implementations for Claude and AWS Bedrock Claude would be created
```

### 3. Create Provider Factory

```typescript
// src/chat/providers/index.ts
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
```

### 4. Create Chat Integrator

```typescript
// src/chat/integrator.ts
import { McpIntegratorConfig, Provider } from '../common/types.js'
import { createProvider } from './providers/index.js'
import { create as createIntegratorFeatures } from '../integrator/features/index.js'
import { ChatIntegrator, ChatState } from './types.js'

export function createChatIntegrator(config: McpIntegratorConfig, client: any): ChatIntegrator {
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
    } catch (error) {
      console.error("Error sending message:", error.message)
      return `Error: ${error.message}`
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
```

### 5. Rewrite the Chat CLI Script

```typescript
// bin/testChatIntegrator.mts
#!/usr/bin/env tsx
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import { McpIntegratorConfig } from '../src/common/types.js'
import inquirer from 'inquirer'
import { createChatIntegrator } from '../src/chat/integrator.js'
import { OpenAI } from 'openai'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { Anthropic } from '@anthropic-ai/sdk'

const readConfig = (configPath: string) => {
  const configContent = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(configContent).integrator as McpIntegratorConfig
}

const createClient = (config: McpIntegratorConfig) => {
  switch (config.provider) {
    case 'openai':
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    case 'claude':
      return new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    case 'aws-bedrock-claude':
      return new BedrockRuntimeClient({
        region: process.env.AWS_REGION
      })
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

const chatLoop = async (config: McpIntegratorConfig) => {
  const client = createClient(config)
  const integrator = await createChatIntegrator(config, client)
  
  try {
    let continueLoop = true
    
    while (continueLoop) {
      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'userInput',
        message: 'Chat (exit to quit):',
      }])
      
      const userInput = answers.userInput
      
      if (userInput.toLowerCase() === 'exit') {
        continueLoop = false
        console.info('Exiting program...')
      } else {
        try {
          const response = await integrator.sendMessage(userInput)
          console.info(response)
        } catch (error) {
          console.error("Error processing request:", error.message)
        }
      }
    }
  } finally {
    await integrator.disconnect()
  }
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Test the MCP Integrator as a chat tool.',
  })
  
  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })
  
  const args = parser.parse_args()
  const config = readConfig(args.config)
  await chatLoop(config)
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('An error occurred:', error)
  })
}
```

## Implementation Steps

1. Create the directory structure for the new modules:
   ```
   src/chat/
   ├── types.ts
   └── providers/
       ├── index.ts
       ├── openai.ts
       ├── claude.ts
       └── aws-bedrock-claude.ts
   └── integrator.ts
   ```

2. Implement the provider functions with provider-specific logic from the services.ts file.

3. Implement the chat integrator function to handle the messaging flow.

4. Update the testChatIntegrator.mts script to use the new chat integrator.

5. Fix TypeScript type issues in the existing code.

6. Add tests for each provider implementation.

## Benefits

1. **Modularity**: Provider-specific logic is encapsulated in separate functions.
2. **Extensibility**: Adding new providers becomes straightforward.
3. **Type Safety**: Properly defined types will resolve the current type issues.
4. **Reusability**: The chat integrator can be used in other parts of the application.
5. **Separation of Concerns**: Client imports are kept in the bin directory, keeping the library clean.
6. **Functional Approach**: Uses pure functions and immutable state where possible.

## Challenges and Considerations

1. **API Differences**: Each provider has different API structures and requirements that need to be handled.
2. **Authentication**: Each provider requires different authentication mechanisms.
3. **Error Handling**: Each provider returns different error formats that need to be normalized.
4. **Rate Limiting**: Providers have different rate limits that might need to be considered.
5. **State Management**: Need to carefully manage state in a functional way.

## Next Steps

1. Get approval for this design approach.
2. Implement the provider functions and the chat integrator.
3. Update the testChatIntegrator.mts script.
4. Test with each provider to ensure functionality works as expected. 
4. Test with each provider to ensure functionality works as expected. 