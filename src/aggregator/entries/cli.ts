import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { McpAggregatorCliConfig, McpClientConfigs } from '../../common/types.js'
import { create as createFeatures } from '../features.js'
import { openApiToZodSchema } from '../../common/libs.js'

const create = (config: McpAggregatorCliConfig) => {
  // eslint-disable-next-line functional/no-let
  let server: McpServer | undefined

  const setupServer = async (features: any) => {
    const rawTools = await features.getTools()
    const tools = rawTools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      parameters: tool.inputSchema,
    }))

    server = new McpServer(
      Object.assign({}, McpClientConfigs.aggregator, {
        capabilities: { tools },
      })
    )

    tools.forEach(tool => {
      // @ts-ignore
      server.tool(
        tool.name,
        tool.description || '',
        openApiToZodSchema(tool.parameters),
        async extra => {
          const results = await features.executeTool(tool.name, extra)
          return results as any
        }
      )
    })
  }

  return {
    start: async () => {
      const features = await createFeatures(config)
      await features.connect()
      await setupServer(features)

      const transport = new StdioServerTransport()
      await server?.connect(transport)
    },
    stop: async () => {
      await server?.close()
    },
  }
}

export { create }
