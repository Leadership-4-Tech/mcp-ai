#!/usr/bin/env node

import express from 'express'
import cors from 'cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { McpAggregatorConfigWithSseServer, McpClientConfigs } from '../../common/types.js'
import { create as createFeatures } from '../features.js'

const create = (config: McpAggregatorConfigWithSseServer) => {
  let server: McpServer | undefined
  const transports: Record<string, SSEServerTransport> = {}
  const app = express()
  app.use(express.json())
  app.use(cors())

  const handleSseConnection = async (res: express.Response) => {
    try {
      const transport = new SSEServerTransport('/messages', res)
      const sessionId = transport.sessionId
      transports[sessionId] = transport

      transport.onclose = () => {
        delete transports[sessionId]
      }

      if (server) {
        await server.connect(transport)
      }

      return sessionId
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE stream')
      }
      throw error
    }
  }

  const handlePostMessage = async (req: express.Request, res: express.Response) => {
    const sessionId = req.query.sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).send('Missing sessionId parameter')
      return
    }

    const transport = transports[sessionId]
    if (!transport) {
      res.status(404).send('Session not found')
      return
    }

    try {
      await transport.handlePostMessage(req, res, req.body)
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
      const messagesPath = config.server.messagesPath || '/messages'

      app.get(path, async (req, res) => {
        try {
          const sessionId = await handleSseConnection(res)
          console.log(`Established SSE stream with session ID: ${sessionId}`)
        } catch (error) {
          console.error('Error establishing SSE stream:', error)
        }
      })

      app.post(messagesPath, handlePostMessage)

      app.listen(port)
    },
    stop: async () => {
      await Promise.all(
        Object.values(transports).map(transport => transport.close())
      )
      await server?.close()
    }
  }
}

export {
  create,
}