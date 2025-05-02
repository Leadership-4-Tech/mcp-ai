import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { McpAggregatorConfig, JsonAble, McpClientConfigs } from '../common/types.js'
import { create as createServices } from './services.js'

export const create = async (config: McpAggregatorConfig) => {
  let services: any

  const connect = async () => {
    services = createServices(config)
    await services.connect()
  }

  const disconnect = async () => {
    await services.disconnect()
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
    getTools,
    executeTool,
    connect,
    disconnect,
  }
}
