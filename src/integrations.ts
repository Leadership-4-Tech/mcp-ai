import * as fs from 'fs/promises'
import { asyncMap } from 'modern-async'
import {
  Provider,
  McpIntegrationConfig,
  ToolResponse,
  McpIntegration,
  Tool,
  ClaudeToolFormat,
  OpenAIToolFormat,
  BedrockToolFormat,
  ToolCall,
} from './types'

const MAX_PARALLEL_CALLS = 20

function validateToolUniqueness(tools: readonly Tool[]): Record<string, Tool> {
  const toolNames = new Set<string>();
  return tools.reduce((acc, tool) => {
    if (tool.name in acc) {
      throw new Error(`Duplicate tool name detected: ${tool.name}. 
        Tool names must be unique across all providers to prevent ambiguity during execution.`);
    }
    return Object.assign(acc, { [tool.name]: tool })
  }, {} as Record<string, Tool>)
}


// Claude Formulation
function claudeFormulateResponse(originalResponse: any, toolResponses: any[]): any {
  return {
    messages: [
      ...originalResponse.messages,
      ...toolResponses.map(toolResponse => ({
        role: 'tool',
        content: JSON.stringify(toolResponse),
        tool_call_id: toolResponse.tool_call_id
      }))
    ]
  };
}

// OpenAI Formulation
function openAIFormulateResponse(originalResponse: any, toolResponses: any[]): any {
  return {
    messages: [
      ...originalResponse.messages,
      ...toolResponses.map(toolResponse => ({
        role: 'tool',
        content: toolResponse.output,
        tool_call_id: toolResponse.tool_call_id
      }))
    ],
    tool_choice: 'auto'
  };
}

// Bedrock (Claude in Bedrock) Formulation
function bedrockFormulateResponse(originalResponse: any, toolResponses: any[]): any {
  return {
    ...originalResponse,
    toolResults: toolResponses.map(toolResponse => ({
      toolCallId: toolResponse.tool_call_id,
      content: JSON.stringify(toolResponse)
    }))
  };
}

const executeToolCalls = (config: McpIntegrationConfig) => (calls: readonly ToolCall[]) : Promise<readonly ToolResponse[]>=> {
  const maxParallelCalls = config.maxParallelCalls || MAX_PARALLEL_CALLS
  return asyncMap(calls, tool => {
    // TODO: execute tool
    return {
      tool_call_id: tool.id,
      tool_name: tool.name,
      status: 'success',
      output: {},
      error: undefined,
    }
  }, maxParallelCalls)
}

const createClaudeIntegration = (
  config: McpIntegrationConfig,
): McpIntegration<Provider.Claude> => {
  const tools = config.tools
  const uniqueTools = validateToolUniqueness(tools)

  // Convert to Claude tool formats
  const formattedTools: ClaudeToolFormat[] = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }))
  const _optimized = formattedTools.reduce((acc, tool) => {
    return Object.assign(acc, { [tool.name]: tool})
  }, {} as Record<string, Tool>)

  return {
    executeToolCalls: executeToolCalls(config),
    getTools: () => formattedTools,
    formulateResponse: claudeFormulateResponse,

    getToolCalls: (response: any): readonly ToolCall[] => {
      // TODO: Make sure this is how claude does it.
      return (
        response.tool_calls?.map((call: any) => ({
          id: call.id,
          type: 'claude',
          name: call.name,
          input: call.input,
        })) || []
      )
    },
  }
}

const createOpenAIIntegration = (
  config: McpIntegrationConfig,
): McpIntegration<Provider.OpenAI> => {
  const tools = config.tools
  const uniqueTools = validateToolUniqueness(tools)

  // Convert to OpenAI tool formats
  const formattedTools: OpenAIToolFormat[] = tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))

  return {
    getTools: () => formattedTools,
    executeToolCalls: executeToolCalls(config),
    formulateResponse: openAIFormulateResponse,

    getToolCalls: (response: any): readonly ToolCall[] => {
      // TODO: Make sure this is how OpenAI does it.
      return (
        response.tool_calls?.map((call: any) => ({
          id: call.id,
          type: 'openai',
          name: call.function.name,
          input: JSON.parse(call.function.arguments),
        })) || []
      )
    },
  }
}

const createBedrockIntegration = (
  config: McpIntegrationConfig,
): McpIntegration<Provider.Bedrock> => {
  const tools = config.tools
  const uniqueTools = validateToolUniqueness(tools)

  // Convert to Bedrock tool formats
  const formattedTools: BedrockToolFormat[] = tools.map(tool => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters,
    },
  }))

  return {
    executeToolCalls: executeToolCalls(config),
    getTools: () => formattedTools,
    formulateResponse: bedrockFormulateResponse,

    getToolCalls: (response: any): readonly ToolCall[] => {
      // TODO: Make sure this is how AWS Bedrock /Claude does it.
      return (
        response.tool_calls?.map((call: any) => ({
          id: call.id,
          type: 'bedrock',
          name: call.name,
          input: call.input,
        })) || []
      )
    },
  }
}

export {
  createClaudeIntegration,
  createOpenAIIntegration,
  createBedrockIntegration,
}
