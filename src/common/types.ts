import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js'

export type JsonAble =
  | string
  | number
  | boolean
  | null
  | JsonAble[]
  | { [key: string]: JsonAble }

export type McpConfig = Readonly<{
  transport: Transport
  capabilities?: ClientCapabilities
}>

export enum Provider {
  Claude = 'claude',
  OpenAI = 'openai',
  AwsBedrockClaude = 'aws-bedrock-claude',
}

export type McpTool = Readonly<{
  name: string
  description: string
  inputSchema: OpenAPISchema
  outputSchema?: OpenAPISchema
}>

export type CliConnection = Readonly<{
  type: 'cli'
  path: string
  args?: string[]
  env?: Readonly<Record<string, string>>
  cwd?: string
}>

export type SseConnection = Readonly<{
  type: 'sse'
  url: string
}>

export type Connection =
  | CliConnection 
  | HttpConnection
  | WsConnection
  | SseConnection

export type HttpConnection = Readonly<{
  type: 'http'
  url: string
  headers?: Readonly<Record<string, string>>
  timeout?: number
  retry?: Readonly<{
    attempts: number
    backoff: number
  }>
}>

export type WsConnection = Readonly<{
  type: 'ws'
  url: string
  protocols?: Readonly<string[]>
  headers?: Readonly<Record<string, string>>
  reconnect?: Readonly<{
    attempts: number
    backoff: number
  }>
}>

export type McpIntegratorConfig = Readonly<{
  connection: Connection
  provider: Provider
  includeListToolsTool?: boolean
  maxParallelCalls?: number
}>

export type HttpServerConfig = Readonly<{
  type: 'http'
  port: number
  host?: string
}>

export type WsServerConfig = Readonly<{
  type: 'ws'
  port: number
  host?: string
}>

export type CliServerConfig = Readonly<{
  type: 'cli'
}>

export type SseServerConfig = Readonly<{
  type: 'sse',
  url: string
}>

export type ServerConfig =
  | HttpServerConfig
  | WsServerConfig
  | CliServerConfig
  | SseServerConfig

export type McpAggregatorConfigBase = Readonly<{
  mcps: Readonly<
    Readonly<{
      id: string
      connection: Connection
    }>[]
  >
  maxParallelCalls?: number
}>

export type McpAggregatorConfigWithHttpServer = McpAggregatorConfigBase & Readonly<{
  server: HttpServerConfig
}>

export type McpAggregatorConfigWithWsServer = McpAggregatorConfigBase & Readonly<{
  server: WsServerConfig
}>

export type McpAggregatorConfigWithCliServer = McpAggregatorConfigBase & Readonly<{
  server: CliServerConfig
}>

export type McpAggregatorConfigWithSseServer = McpAggregatorConfigBase & Readonly<{
  server: SseServerConfig
}>

export type McpAggregatorConfig =
  | McpAggregatorConfigWithHttpServer
  | McpAggregatorConfigWithWsServer
  | McpAggregatorConfigWithCliServer
  | McpAggregatorConfigWithSseServer

export type McpIntegratorFullConfig = Readonly<{
  integrator: McpIntegratorConfig
  aggregator: McpAggregatorConfig
}>

export const LibraryVersion = '1.0.0'

export const McpClientConfigs = {
  integrator: {
    name: 'mcp-integrator',
    version: LibraryVersion
  },
  aggregator: {
    name: 'mcp-aggregator',
    version: LibraryVersion
  }
} as const

export type OpenAPISchema = Readonly<{
  type: 'object'
  properties: Readonly<Record<string, {
    type: string
    description?: string
    enum?: Readonly<string[]>
  }>>
  required?: Readonly<string[]>
}>
