import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  Connection,
  JsonAble,
  McpTool,
  McpAggregatorConfig,
} from '../common/types.js'

export type McpAggregator = Readonly<{
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
