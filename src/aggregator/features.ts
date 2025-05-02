import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { McpAggregatorConfig, JsonAble, McpClientConfigs } from '../common/types.js'
import { create as createServices } from './services.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

export const create = async (config: McpAggregatorConfig) => {
  const services = createServices(config)

  const tools = await services.getTools()

  const server = new Server({
    name: 'mcp-aggregator',
    version: '0.0.1',
    tools,
  })

  const client = new Client(McpClientConfigs.aggregator)

  const connect = async (transport: Transport) => {
    await server.connect(transport)
  }

  const disconnect = async (transport: Transport) => {
    await transport.close()
  }

  const dispose = async () => {
    await server.close()
    await services.disconnect()
  }

  const initialize = async () => {
    await services.connect()
    return {
      state: 'initialized',
      initialize,
      getTools,
      executeTool,
      dispose,
    }
  }

  const getTools = async () => {
    return services.getTools()
  }

  const executeTool = async (
    name: string,
    input: Readonly<Record<string, JsonAble>>
  ) => {
    return services.executeTool(name, input)
  }

  return {
    state: 'created',
    initialize,
    getTools,
    executeTool,
    dispose,
  }
}
