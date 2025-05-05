import express from 'express'
import cors from 'cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { McpClientConfigs } from '../../common/types.js'
import { create as createFeatures } from '../features.js'
import { SimpleServerSseConfig } from '../types.js'

const HTTP_ERROR = 500
const BAD_REQUEST = 400
const NOT_FOUND_STATUS = 404
const DEFAULT_PORT = 3000

const create = (config: SimpleServerSseConfig) => {
  // eslint-disable-next-line functional/no-let
  let server: McpServer | undefined
  const transports: Record<string, SSEServerTransport> = {}
  const app = express()
  app.use(express.json())
  app.use(cors())

  const handleSseConnection = async (res: express.Response) => {
    // eslint-disable-next-line functional/no-try-statements
    try {
      const transport = new SSEServerTransport('/messages', res)
      const sessionId = transport.sessionId
      // eslint-disable-next-line functional/immutable-data
      transports[sessionId] = transport

      // eslint-disable-next-line functional/immutable-data
      transport.onclose = () => {
        // eslint-disable-next-line functional/immutable-data
        delete transports[sessionId]
      }

      if (server) {
        await server.connect(transport)
      }

      return sessionId
    } catch {
      if (!res.headersSent) {
        res.status(HTTP_ERROR).send('Error establishing SSE stream')
      }
      throw new Error('Failed to establish SSE connection')
    }
  }

  const handlePostMessage = async (
    req: express.Request,
    res: express.Response
  ) => {
    const sessionId = req.query.sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(BAD_REQUEST).send('Missing sessionId parameter')
      return
    }

    const transport = transports[sessionId]
    if (!transport) {
      res.status(NOT_FOUND_STATUS).send('Session not found')
      return
    }

    // eslint-disable-next-line functional/no-try-statements
    try {
      await transport.handlePostMessage(req, res, req.body)
    } catch {
      if (!res.headersSent) {
        res.status(HTTP_ERROR).send('Error handling request')
      }
    }
  }

  const setupServer = async (features: any) => {
    features.validateConfig()

    server = new McpServer(
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
  }

  return {
    start: async (port: number = DEFAULT_PORT) => {
      const features = await createFeatures(config)
      await setupServer(features)

      const path = config.server.path || '/'
      const messagesPath = config.server.messagesPath || '/messages'

      app.get(path, async (req, res) => {
        // eslint-disable-next-line functional/no-try-statements
        try {
          await handleSseConnection(res)
        } catch {
          // Error already handled in handleSseConnection
        }
      })

      app.post(messagesPath, handlePostMessage)

      // Add catch-all route for non-existent URLs
      app.use((req, res) => {
        res.status(NOT_FOUND_STATUS).json({
          error: 'Not Found',
          message: `The requested URL ${req.url} was not found on this server`,
          status: NOT_FOUND_STATUS,
        })
      })

      app.listen(port)
    },
    stop: async () => {
      await Promise.all(
        Object.values(transports).map(transport => transport.close())
      )
      await server?.close()
    },
  }
}

export { create }
