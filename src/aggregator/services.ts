import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { asyncMap } from 'modern-async'
import {
  McpAggregatorConfig,
  McpClientConfigs,
  Connection,
} from '../common/types.js'
import { createTransport } from '../common/libs.js'

const DEFAULT_MAX_PARALLEL_CALLS = 10

const create = (config: McpAggregatorConfig) => {
  // eslint-disable-next-line functional/no-let
  let clients: Record<string, Client> = {}

  const createClient = async (connection: Connection) => {
    const transport = createTransport(connection)
    const client = new Client(McpClientConfigs.integrator)
    await client.connect(transport)
    return client
  }

  return {
    connect: async () => {
      clients = await Promise.all(
        config.mcps.map(async mcp => {
          const client = await createClient(mcp.connection)
          return [mcp.id, client]
        })
      ).then(Object.fromEntries)
    },
    getTools: async () => {
      const allTools = await asyncMap(
        Object.values(clients),
        client => {
          return client.listTools().then(x => x.tools)
        },
        config.maxParallelCalls || DEFAULT_MAX_PARALLEL_CALLS
      )
      return allTools.flat()
    },
    executeTool: async (toolName: string, params: any) => {
      const results = await asyncMap(
        Object.values(clients),
        client => {
          return client
            .callTool({ name: toolName, input: params })
            .catch(() => [])
        },
        config.maxParallelCalls || DEFAULT_MAX_PARALLEL_CALLS
      )
      return results.flat()
    },
  }
}

export { create }
