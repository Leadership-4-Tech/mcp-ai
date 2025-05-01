import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import {
  McpIntegratorConfig,
  Provider,
  HttpConnection,
  WsConnection,
  RpcCliConnection,
} from '../common/types.js'
import { toMcpConfig } from '../common/libs.js'
import {
  IntegratorService,
  ToolFormat,
  Response,
  ToolCall,
  ToolResult,
} from './types.js'

const createExecuteToolCalls =
  (client: Client) =>
  async (calls: readonly ToolCall[]): Promise<readonly ToolResult[]> =>
    Promise.all(
      calls.map(async call => {
        const result = await client.callTool({
          name: call.name,
          input: call.input,
        })
        return result.result
      })
    )

const createSharedComponents = (config: McpIntegratorConfig) => {
  const client = new Client({
    name: 'mcp-integrator',
    version: '0.0.1',
  })

  let transport
  switch (config.connection.type) {
    case 'http': {
      const httpConfig = config.connection as HttpConnection
      transport = new StreamableHTTPClientTransport(
        new URL(httpConfig.url),
        toMcpConfig(httpConfig)
      )
      break
    }
    case 'ws': {
      const wsConfig = config.connection as WsConnection
      transport = new WebSocketClientTransport(new URL(wsConfig.url))
      break
    }
    case 'cli': {
      const cliConfig = config.connection as unknown as RpcCliConnection
      transport = new StdioClientTransport({
        command: cliConfig.path,
        args: cliConfig.args,
        env: cliConfig.env,
        cwd: cliConfig.cwd,
      })
      break
    }
    default:
      throw new Error(`Unsupported connection type: ${config.connection.type}`)
  }

  const executeToolCalls = createExecuteToolCalls(client)

  return {
    transport,
    client,
    executeToolCalls,
  }
}

const createClaudeService = (
  config: McpIntegratorConfig
): IntegratorService => {
  const { transport, client, executeToolCalls } = createSharedComponents(config)

  const connect = async () => {
    await client.connect(transport)
  }

  const disconnect = async () => {
    await client.close()
  }

  const getTools = async () => {
    const result = await client.listTools()
    return result.tools
  }

  const formatToolsForProvider = (
    tools: readonly ToolFormat[]
  ): readonly ToolFormat[] =>
    tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }))

  const extractCallsFromProviderResponse = (
    response: Response
  ): readonly ToolCall[] =>
    (response as any).tool_calls?.map((call: any) => ({
      name: call.name,
      input: call.input,
    })) || []

  const combineProviderResponseWithResults = (
    response: Response,
    results: readonly ToolResult[]
  ): Response => ({
    ...(response as Record<string, unknown>),
    tool_results: results.map(result => ({
      content: result,
    })),
  })

  return {
    connect,
    disconnect,
    getTools,
    formatToolsForProvider,
    extractCallsFromProviderResponse,
    executeToolCalls,
    combineProviderResponseWithResults,
  }
}

const createOpenAIService = (
  config: McpIntegratorConfig
): IntegratorService => {
  const { transport, client, executeToolCalls } = createSharedComponents(config)

  const connect = async () => {
    await client.connect(transport)
  }

  const disconnect = async () => {
    await client.close()
  }

  const getTools = async () => {
    const result = await client.listTools()
    return result.tools
  }

  const formatToolsForProvider = (
    tools: readonly ToolFormat[]
  ): readonly ToolFormat[] =>
    tools.map(tool => ({
      name: tool.name,
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }))

  const extractCallsFromProviderResponse = (
    response: Response
  ): readonly ToolCall[] =>
    (response as any).tool_calls?.map((call: any) => ({
      name: call.function.name,
      input: JSON.parse(call.function.arguments),
    })) || []

  const combineProviderResponseWithResults = (
    response: Response,
    results: readonly ToolResult[]
  ): Response => ({
    ...(response as Record<string, unknown>),
    tool_calls: (response as any).tool_calls?.map((call: any, i: number) => ({
      ...call,
      function: {
        ...call.function,
        result: results[i],
      },
    })),
  })

  return {
    connect,
    disconnect,
    getTools,
    formatToolsForProvider,
    extractCallsFromProviderResponse,
    executeToolCalls,
    combineProviderResponseWithResults,
  }
}

const createAwsBedrockClaudeService = (
  config: McpIntegratorConfig
): IntegratorService => {
  const { transport, client, executeToolCalls } = createSharedComponents(config)

  const connect = async () => {
    await client.connect(transport)
  }

  const disconnect = async () => {
    await client.close()
  }

  const getTools = async () => {
    const result = await client.listTools()
    return result.tools
  }

  const formatToolsForProvider = (
    tools: readonly ToolFormat[]
  ): readonly ToolFormat[] =>
    tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }))

  const extractCallsFromProviderResponse = (
    response: Response
  ): readonly ToolCall[] =>
    (response as any).tool_calls?.map((call: any) => ({
      name: call.name,
      input: call.input,
    })) || []

  const combineProviderResponseWithResults = (
    response: Response,
    results: readonly ToolResult[]
  ): Response => ({
    ...(response as Record<string, unknown>),
    tool_results: results.map(result => ({
      content: result,
    })),
  })

  return {
    connect,
    disconnect,
    getTools,
    formatToolsForProvider,
    extractCallsFromProviderResponse,
    executeToolCalls,
    combineProviderResponseWithResults,
  }
}

export const create = (config: McpIntegratorConfig): IntegratorService => {
  switch (config.provider) {
    case Provider.Claude:
      return createClaudeService(config)
    case Provider.OpenAI:
      return createOpenAIService(config)
    case Provider.AwsBedrockClaude:
      return createAwsBedrockClaudeService(config)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}
