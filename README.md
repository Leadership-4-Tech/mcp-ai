# MCP Aggregator and Integrator Library

MCP servers are pretty sweet but sometimes you need to aggregate them all together and provide it to your AI agents, for maximum power.

## Overview

A flexible, type-safe tool integration library for managing and executing tools across different providers (Claude, OpenAI, Bedrock).

## Features

-  Supports multiple providers
- ️ Type-safe tool integration
-  Early duplicate tool name detection
- 里 Functional programming approach

## Dependencies
Only 1 to keep it slim, but functional.

- modern-async

## Installation

```bash
npm install mcp-integrator
```

## Quick Start
Here is a quick start guide.

### High Level Steps 
Here is a high level steps to use the library.

0. Create a configuration that has the MCP tools to aggregate / integrate. (format shown below)
1. Configure this library with one of two load functions.
2. Use this library to get an LLM specific formatted list of tools. Either all of them, or filter them for a specific LLM call where you only want a subsection.
3. You pass the formatted list of tools with your message to the LLM api.
4. Use this library to see if you need to do to tool calls from the LLM specific response.
5. If you need to make tool calls, use this library to route the tool calls to the MCPs, and combine their response.
6. Use this library to formulate a LLM specific reply passing the previous response, and the tool responses.

### Config Format
The configuration is a json/object in the following format (examples):

```typescript
type ProviderConfig = {
  id: string
  type: string
  name: string
  tools?: Tool[]
}

type Tool = {
  name: string
  description: string
  parameters: Record<string, unknown>
}
```
```json
{
  "tools": [
    {
      "name": "web_search",
      "description": "Perform a web search and return top results",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query to perform"
          },
          "num_results": {
            "type": "number",
            "description": "Number of search results to return",
            "default": 5
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "calculator",
      "description": "Perform mathematical calculations",
      "parameters": {
        "type": "object",
        "properties": {
          "expression": {
            "type": "string",
            "description": "Mathematical expression to evaluate"
          }
        },
        "required": ["expression"]
      }
    }
  ]
}
```

### Loading Configuration

```typescript
import {
  Provider,
  loadFromConfig,
  loadFromFile,
} from '@your-org/mcp-integration'

// An object in the format listed above.
const mcpConfig = {]

// Load from configuration object
const claudeIntegration = loadFromConfig(mcpConfig, Provider.Claude)

// Load from file
const openAIIntegration = await loadFromFile(
  './mcp-config.json',
  Provider.OpenAI
)
```

### Get the formatted tools (Claude shown)
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
  tools: claudeIntegration.getTools(), // passes all available tools
  tool_choice: { type: 'auto' },
  messages: [
    {
      role: 'user',
      content: 'What is the weather like in New York today? Also, can you check the current stock price of Apple?'
    }
  ]
})
```

### Determine if you need to make tool calls.
```typescript
const toolCalls = claudeIntegration.getToolCalls(response)
if (!toolCalls) {
  // You're done otherwise, you have a list of tool calls.
}
```

### Execute tool calls
```typescript
const toolResponses = await claudeIntegration.executeToolCalls(toolCalls)
```

### Combine tool results with previous results and call LLM provider
```typescript
const properPayload = claudeIntegration.formulateResponse(response, toolResponses)
const nextResponse = await claude.messages.create(properPayload)

```


## Error Handling

- Duplicate tool names will throw an error during configuration loading
- Tool call execution provides detailed error information

## Provider Support

- Claude
- OpenAI
- Bedrock

## Advanced Usage

### Custom Tool Execution

```typescript
// Implement custom tool execution logic
const customToolResponse = await integration.executeToolCalls(toolCalls, {
  // Custom execution options
})
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
GPL v3
