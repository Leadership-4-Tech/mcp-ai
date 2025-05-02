#!/usr/bin/env node

import express from 'express'
import cors from 'cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { McpAggregatorConfigWithHttpServer, McpClientConfigs } from '../../common/types.js'
import { create as createFeatures } from '../features.js'

const create = (config: McpAggregatorConfigWithHttpServer) => {
  let server: McpServer | undefined
  const app = express()
  app.use(express.json())
  app.use(cors())

  const handleRequest = async (req: express.Request, res: express.Response) => {
    try {
      const transport = new StreamableHTTPServerTransport(req)
      if (server) {
        await server.connect(transport)
      }
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).send('Error handling request')
      }
    }
  }

  const setupServer = async (features: any) => {
    const rawTools = await features.getTools()
    const tools = rawTools.map(tool => ({
      name: tool.name,
      description: tool.description || "",
      parameters: tool.inputSchema
    }))

    server = new McpServer(Object.assign({}, McpClientConfigs.aggregator, {
      capabilities: { tools },
    }))

    tools.forEach(tool => {
      // @ts-ignore
      server.tool(tool.name, tool.description || "", tool.parameters, async (extra) => {
        const results = await features.executeTool(tool.name, extra)
        return results as any
      })
    })
  }

  return {
    start: async (port: number = 3000) => {
      const features = await createFeatures(config)
      await features.connect()
      await setupServer(features)

      const path = config.server.path || '/'
      app.post(path, handleRequest)
      app.listen(port)
    },
    stop: async () => {
      await server?.close()
    }
  }
}

export { create } 