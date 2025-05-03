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
  // eslint-disable-next-line functional/no-let
  let toolToClient: Record<string, Client> = {}

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
      toolToClient = {}
      const allTools = await asyncMap(
        Object.values(clients),
        async client => {
          const tools = await client.listTools().then(x => x.tools)
          tools.forEach(tool => {
            // eslint-disable-next-line functional/immutable-data
            toolToClient[tool.name] = client
          })
          return tools
        },
        config.maxParallelCalls || DEFAULT_MAX_PARALLEL_CALLS
      )
      return allTools.flat()
    },
    executeTool: async (toolName: string, params: any) => {
      const client = toolToClient[toolName]
      return client
        .callTool({ name: toolName, arguments: params })
        .catch(() => [])
    },
  }
}

export { create }
