import type { Connection, McpTool, McpAggregatorConfig } from '../common/types.js'

/**
 * State of an MCP Aggregator instance
 */
export type McpAggregatorState = Readonly<{
  config: McpAggregatorConfig
  tools: Readonly<McpTool[]>
  connections: Readonly<Record<string, Connection>>
}>
