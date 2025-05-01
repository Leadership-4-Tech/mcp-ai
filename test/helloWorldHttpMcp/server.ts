import { Server } from '@modelcontextprotocol/sdk/server'
import {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport'
import {
  JSONRPCMessage,
  Request,
  Notification,
  Result,
} from '@modelcontextprotocol/sdk/types'
import { createServer } from 'http'
import { parse } from 'url'

const tools = [
  {
    name: 'hello',
    description: 'Says hello to someone',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name to say hello to',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'goodbye',
    description: 'Says goodbye to someone',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name to say goodbye to',
        },
      },
      required: ['name'],
    },
  },
]

const create = () => {
  const server = new Server({
    name: 'hello-world-http',
    version: '0.0.1',
    capabilities: {
      tools: {
        hello: {
          description: 'Says hello to someone',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name to say hello to',
              },
            },
            required: ['name'],
          },
        },
        goodbye: {
          description: 'Says goodbye to someone',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name to say goodbye to',
              },
            },
            required: ['name'],
          },
        },
      },
    },
  })

  const handleRequest = async (request: Readonly<Request>): Promise<Result> => {
    console.log('=== HANDLING REQUEST ===')
    console.log('Request:', JSON.stringify(request, null, 2))

    if (request.method === 'initialize') {
      console.log('>>> Processing initialize request')
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          serverInfo: {
            name: 'hello-world-http',
            version: '0.0.1',
          },
          protocolVersion: '2024-11-05',
          capabilities: {
            toolUse: {
              enabled: true,
            },
            toolList: {
              enabled: true,
            },
            toolCall: {
              enabled: true,
            },
            tools: {
              hello: {
                description: 'Says hello to someone',
                parameters: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name to say hello to',
                    },
                  },
                  required: ['name'],
                },
              },
              goodbye: {
                description: 'Says goodbye to someone',
                parameters: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name to say goodbye to',
                    },
                  },
                  required: ['name'],
                },
              },
            },
          },
        },
      }
    }

    if (request.method === 'tools/list') {
      console.log('>>> Processing tools/list request')
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools },
      }
    }

    if (request.method === 'tools/call') {
      console.log('>>> Processing tools/call request')
      const { name, input } = request.params

      let result
      if (name === 'hello') {
        result = {
          content: [
            {
              type: 'text',
              text: `Hello, ${input.name}!`,
            },
          ],
        }
      } else if (name === 'goodbye') {
        result = {
          content: [
            {
              type: 'text',
              text: `Goodbye, ${input.name}!`,
            },
          ],
        }
      } else {
        throw new Error(`Unknown tool: ${name}`)
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result,
      }
    }

    console.log('!!! Unknown method:', request.method)
    throw new Error(`Unknown method: ${request.method}`)
  }

  const httpServer = createServer((req, res) => {
    const { pathname } = parse(req.url || '', true)

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.method === 'POST' && pathname === '/') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })

      req.on('end', async () => {
        let message: any
        try {
          console.log('=== HTTP SERVER DEBUG ===')
          console.log('Incoming request:')
          console.log('Headers:', req.headers)
          console.log('Body:', body)

          message = JSON.parse(body)

          // Handle notifications (messages without an id)
          if (!('id' in message)) {
            console.log('Handling notification:', message.method)
            if (message.method === 'notifications/initialized') {
              console.log('Client initialized')
              res.writeHead(200)
              res.end()
              return
            }
            // For other notifications, we just send 200 OK without a body
            res.writeHead(200)
            res.end()
            return
          }

          // Handle requests (messages with an id)
          const response = await handleRequest(message)

          console.log('Sending response:', JSON.stringify(response, null, 2))
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(response))
        } catch (error) {
          console.error('Error handling request:', error)
          const errorResponse = {
            jsonrpc: '2.0',
            id: message?.id,
            error: {
              code: -32600,
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          }
          console.log(
            'Sending error response:',
            JSON.stringify(errorResponse, null, 2)
          )
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(errorResponse))
        }
      })
    } else if (req.method === 'GET' && pathname === '/') {
      // Handle GET requests to root path
      console.log('Handling GET request to root path')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          name: 'hello-world-http',
          version: '0.0.1',
          protocolVersion: '2024-11-05',
        })
      )
    } else {
      console.log('Received non-POST request:', req.method, pathname)
      res.writeHead(404)
      res.end()
    }
  })

  const start = async () => {
    const port = process.env.PORT || 3000
    httpServer.listen(port, () => {
      console.log(`HTTP MCP server listening on port ${port}`)
    })
    return server
  }

  const stop = async () => {
    await server.close()
    httpServer.close()
  }

  return {
    start,
    stop,
  }
}

const main = async () => {
  console.log('=== SERVER STARTING ===')
  console.log('Creating server...')
  const server = create()

  console.log('Starting server...')
  await server.start()
  console.log('=== SERVER READY ===')
}

main().catch(console.error)
