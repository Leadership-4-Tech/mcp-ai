import express from 'express'
import cors from 'cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { McpClientConfigs, ExpressOptions } from '../../common/types.js'
import { create as createFeatures } from '../features.js'
import { SimpleServerHttpConfig } from '../types.js'

const DEFAULT_PORT = 3000
const BAD_REQUEST_STATUS = 400
const NOT_FOUND_STATUS = 404

const create = (config: SimpleServerHttpConfig, options?: ExpressOptions) => {
  const app = express()
  app.use(express.json())
  app.use(cors())

  options?.preRouteMiddleware?.forEach(middleware => app.use(middleware))

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

  const setupServer = async (features: any) => {
    features.validateConfig()

    const server = new McpServer(
      Object.assign({}, McpClientConfigs.aggregator, {
        capabilities: { tools: config.tools },
        name: config.name,
        version: config.version,
      })
    )
    const formatted = features.getFormattedTools()
    formatted.forEach(tool => {
      //@ts-ignore
      server.tool(...tool)
    })

    return server
  }

  const handleRequest =
    (features: any) => async (req: express.Request, res: express.Response) => {
      try {
        const server = await setupServer(features)
        const transport: StreamableHTTPServerTransport =
          new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
          })
        res.on('close', () => {
          console.log('Request closed')
          transport.close()
          server.close()
        })
        await server.connect(transport)
        await transport.handleRequest(req, res, req.body)
      } catch (error) {
        console.error('Error handling MCP request:', error)
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          })
        }
      }
    }

  const _unhandledRequest = (req, res: express.Response) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      })
    )
  }

  const getApp = async (): Promise<express.Express> => {
    const features = createFeatures(config)

    options?.additionalRoutes?.forEach(route => {
      app[route.method](route.path, route.handler)
    })

    // Handle POST requests for client-to-server communication
    app.post(config.server.path || '/', handleRequest(features))
    // Handle GET requests for server-to-client notifications
    app.get(config.server.path || '/', _unhandledRequest)
    // Handle DELETE requests for session termination
    app.delete(config.server.path || '/', _unhandledRequest)

    // Add catch-all route for non-existent URLs
    app.use((req, res) => {
      res.status(NOT_FOUND_STATUS).json({
        error: 'Not Found',
        message: `The requested URL ${req.url} was not found on this server`,
        status: NOT_FOUND_STATUS,
      })
    })

    return app
  }

  return {
    getApp,
    start: async () => {
      const app = await getApp()
      app.listen(config.server.connection.port || DEFAULT_PORT)
    },
    stop: async () => {
      Object.values(transports).forEach(transport => transport.close())
    },
  }
}
export { create }
