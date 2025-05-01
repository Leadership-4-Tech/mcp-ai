import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  Connection,
  JsonAble,
  HttpConnection,
  WsConnection,
  SimpleCliConnection,
  RpcCliConnection,
  McpTool,
} from '../common/types.js'

export type McpAggregatorServerConfig =
  | HttpConnection
  | WsConnection
  | SimpleCliConnection
  | RpcCliConnection

export type McpAggregatorConfig = Readonly<{
  mcps: readonly Readonly<{
    id: string
    connection: Connection
  }>[]
  maxParallelCalls?: number
  server: McpAggregatorServerConfig
}>

export type McpAggregatorState = Readonly<{
  config: McpAggregatorConfig
  clients: Readonly<Map<string, Server>>
}>

export type McpAggregator = Readonly<{
  state: McpAggregatorState
  initialize: () => Promise<McpAggregator>
  getTools: () => Promise<readonly McpTool[]>
  executeTool: (
    mcpId: string,
    toolName: string,
    input: Readonly<Record<string, JsonAble>>
  ) => Promise<unknown>
  routeToolCall: (
    mcpId: string,
    toolName: string,
    input: Readonly<Record<string, JsonAble>>
  ) => Promise<unknown>
  dispose: () => Promise<void>
}>
