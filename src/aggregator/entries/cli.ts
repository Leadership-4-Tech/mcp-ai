#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { McpAggregatorConfigWithCliServer, McpClientConfigs } from '../../common/types.js'
import { create as createFeatures } from '../features.js'

const create = (config: McpAggregatorConfigWithCliServer) => {
  let server: McpServer | undefined

  return {
    start: async () => {
      const features = await createFeatures(config)
      await features.connect()
      const rawTools = await features.getTools()

      const tools = rawTools.map(tool => ({
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema
      }))

      server = new McpServer(Object.assign({}, McpClientConfigs.aggregator, {
        capabilities: {
          tools,
        },
      }))

      tools.forEach(tool => {
        // @ts-ignore
        server.tool(tool.name, tool.description || "", tool.parameters, async (extra) => {
          const results = await features.executeTool(tool.name, extra)
          return results as any
        })
      })
      const transport = new StdioServerTransport()
      await server.connect(transport)

    },
    stop: async () => {
      await server?.close()
    }
  }
}

export {
  create,
} 