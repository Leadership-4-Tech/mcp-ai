import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { McpAggregatorConfig, McpClientConfigs, McpTool } from '../common/types.js'
import { JsonAble } from '../common/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { createTransport } from '../common/libs.js'

const create = (config: McpAggregatorConfig) => {
  const clients = new Map<
    string,
    Client
  >()
  const transports = new Map<string, Transport>()
  const toolLookup = new Map<string, { mcpId: string; tool: unknown }>()
  let server: Server | undefined
  let serverTransport: Transport | undefined

  const connect = async () => {
    serverTransport = createTransport(config.server.connection)
    // Setup The Server First before the clients.
    const tools = await getTools()
    server = new Server({
      name: 'mcp-aggregator',
      version: '0.0.1',
      tools,
    })
    await server.connect(serverTransport)

    // Then connect to all MCPs clients
    await Promise.all(
      config.mcps.map(async mcp => {
        const transport = createTransport(mcp.connection)
        const client = new Client(McpClientConfigs.aggregator)
        await client.connect(transport)
        clients.set(mcp.id, client)
        transports.set(mcp.id, transport)
        // Build tool lookup map
        const tools = await clients.get(mcp.id)?.listTools()
        if (tools?.tools) {
          tools.tools.forEach(tool => {
            toolLookup.set(tool.name, { mcpId: mcp.id, tool })
          })
        }
      })
    )
  }

  const getTools = async (): Promise<readonly McpTool[]> => {
    return Array.from(toolLookup.values()).map(({ tool }) => tool as McpTool)
  }

  const executeTool = async (
    name: string,
    input: Readonly<Record<string, JsonAble>>
  ) => {
    const toolInfo = toolLookup.get(name)
    if (!toolInfo) {
      throw new Error(`Tool not found: ${name}`)
    }
    const result = await clients.get(toolInfo.mcpId)?.callTool({ name, input })
    return result
  }

  const disconnect = async () => {
    serverTransport?.close()
    // First disconnect all clients
    await Promise.all(
      Array.from(clients.values()).map(async client => {
        try {
          await client.close()
        } catch (error) {
          console.error('Error closing client:', error)
        }
      })
    )

    // Then close all transports
    await Promise.all(
      Array.from(transports.values()).map(async transport => {
        try {
          await transport.close()
        } catch (error) {
          console.error('Error closing transport:', error)
        }
      })
    )

    // Clear the maps
    clients.clear()
    transports.clear()
    toolLookup.clear()
  }

  return {
    connect,
    disconnect,
    getTools,
    executeTool,
  }
}

export { create }
