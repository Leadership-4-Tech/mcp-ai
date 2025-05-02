import type { McpAggregatorConfig } from '../common/types.js'

import { create as createServices } from './services.js'

const create = (config: McpAggregatorConfig) => {
  // eslint-disable-next-line functional/no-let
  let services: ReturnType<typeof createServices> | undefined

  return {
    connect: async () => {
      services = createServices(config)
      await services.connect()
    },
    getTools: async () => {
      if (!services) {
        throw new Error('Services not initialized')
      }
      return services.getTools()
    },
    executeTool: async (toolName: string, params: any) => {
      if (!services) {
        throw new Error('Services not initialized')
      }
      return services.executeTool(toolName, params)
    },
  }
}

export { create }
