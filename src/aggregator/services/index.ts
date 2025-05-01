import flatten from 'lodash/flatten.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js'
import {
  JSONRPCMessage,
  Request,
  Notification,
  Result,
} from '@modelcontextprotocol/sdk/types.js'
import {
  McpAggregatorConfig,
  SimpleCliConnection,
  RpcCliConnection,
  HttpConnection,
  WsConnection,
  ContainerPerRequestConnection,
  PersistentContainerConnection,
  McpTool,
  ServerConfig,
} from '../../common/types.js'
import { JsonAble } from '../../common/types.js'
import { spawn } from 'child_process'
import axios from 'axios'
import WebSocket from 'ws'
import { createDockerTransport } from './docker.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { randomUUID } from 'crypto'
import { asyncMap } from 'modern-async'

const createCliTransport = (
  connection: Readonly<SimpleCliConnection>
): Readonly<Transport> => {
  let messageCallback:
    | ((
        message: Readonly<JSONRPCMessage>,
        extra?: { authInfo?: unknown }
      ) => void)
    | undefined
  let errorCallback: ((error: Error) => void) | undefined
  let isStarted = false

  const executeCliCommand = async (
    message: Readonly<JSONRPCMessage>
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        console.error('==== Executing CLI command ====')
        const [command, ...args] = connection.path.split(' ')

        // Add the JSON-RPC message as the last argument
        const fullArgs = [...args, JSON.stringify(message)]
        console.error('Command:', command)
        console.error('Args:', fullArgs)

        const proc = spawn(command, fullArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
          env: connection.env,
          cwd: connection.cwd,
        })

        let stdout = ''
        let stderr = ''

        proc.stdout?.on('data', data => {
          stdout += data.toString()
        })

        proc.stderr?.on('data', data => {
          stderr += data.toString()
          console.error('CLI stderr:', data.toString())
        })

        proc.on('error', error => {
          console.error('CLI error:', error)
          reject(error)
        })

        proc.on('exit', (code, signal) => {
          console.error('CLI exit:', code, signal)
          if (code === 0) {
            try {
              const response = JSON.parse(stdout) as JSONRPCMessage
              if ('result' in response) {
                // For tool list, pass through the actual tools
                if (
                  'method' in message &&
                  message.method === 'listTools' &&
                  response.result?.tools
                ) {
                  messageCallback?.({
                    jsonrpc: '2.0',
                    result: response.result,
                    id: response.id,
                  })
                } else {
                  // For other responses, pass through as is
                  messageCallback?.(response)
                }
              }
              resolve()
            } catch (error) {
              console.error('Failed to parse CLI output:', error)
              reject(error)
            }
          } else {
            reject(new Error(`CLI failed with code ${code}: ${stderr}`))
          }
        })
      } catch (error) {
        console.error('CLI execution error:', error)
        reject(error)
      }
    })
  }

  return {
    start: async () => {
      isStarted = true
    },
    send: async (message: Readonly<JSONRPCMessage>) => {
      if (!isStarted) {
        throw new Error('Transport not ready')
      }

      // For callTool, we need to format the message correctly
      if ('method' in message && message.method === 'callTool') {
        const request = message as Request
        if (!request.params?.name || !request.params?.input) {
          throw new Error('Invalid callTool request: missing name or input')
        }
        await executeCliCommand({
          jsonrpc: '2.0',
          method: 'callTool',
          params: {
            name: request.params.name,
            input: request.params.input,
          },
          id: 1, // Use a constant ID for CLI mode
        })
      } else {
        await executeCliCommand(message)
      }
    },
    close: async () => {
      isStarted = false
    },
    onmessage: undefined,
    onerror: undefined,
  }
}

const createCliPersistentTransport = (
  connection: Readonly<RpcCliConnection>
): Readonly<Transport> => {
  let process: ReturnType<typeof spawn> | null = null
  let messageCallback:
    | ((
        message: Readonly<JSONRPCMessage>,
        extra?: { authInfo?: unknown }
      ) => void)
    | undefined
  let errorCallback: ((error: Error) => void) | undefined
  let isStarted = false

  return {
    start: async () => {
      return new Promise<void>((resolve, reject) => {
        try {
          const [command, ...args] = connection.path.split(' ')
          process = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            env: connection.env,
            cwd: connection.cwd,
          })

          if (!process.stdin || !process.stdout || !process.stderr) {
            reject(new Error('Failed to create process streams'))
            return
          }

          // Handle process errors
          process.on('error', error => {
            console.error('Process error:', error)
            errorCallback?.(error)
            if (!isStarted) {
              reject(error)
            }
          })

          process.on('exit', (code, signal) => {
            console.error(
              `Process exited with code ${code} and signal ${signal}`
            )
            if (code !== null && code !== 0) {
              const error = new Error(`Process exited with code ${code}`)
              errorCallback?.(error)
              if (!isStarted) {
                reject(error)
              }
            } else if (signal) {
              const error = new Error(`Process killed with signal ${signal}`)
              errorCallback?.(error)
              if (!isStarted) {
                reject(error)
              }
            }
          })

          if (process.stdout) {
            process.stdout.on('data', data => {
              try {
                console.error('Process stdout:', data.toString())
                const message = JSON.parse(data.toString()) as JSONRPCMessage
                messageCallback?.(message)
              } catch (error) {
                console.error('Error parsing stdout:', error)
                errorCallback?.(
                  error instanceof Error ? error : new Error(String(error))
                )
              }
            })
          }

          if (process.stderr) {
            process.stderr.on('data', data => {
              console.error('Process stderr:', data.toString())
            })
          }

          // Wait for process to be ready
          setTimeout(() => {
            isStarted = true
            resolve()
          }, 500)
        } catch (error) {
          console.error('Failed to start process:', error)
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      })
    },
    send: async (message: Readonly<JSONRPCMessage>) => {
      const proc = process
      if (!proc?.stdin) {
        throw new Error('Transport not started')
      }

      if (!isStarted) {
        throw new Error('Transport not ready')
      }

      // At this point we know stdin exists
      const stdin = proc.stdin

      return new Promise<void>((resolve, reject) => {
        const success = stdin.write(JSON.stringify(message) + '\n', error => {
          if (error) reject(error)
          else resolve()
        })
        if (!success) {
          stdin.once('drain', resolve)
        }
      })
    },
    close: async () => {
      if (process) {
        process.kill()
        process = null
      }
      isStarted = false
    },
    onmessage: undefined,
    onerror: undefined,
  }
}

const createHttpTransport = (
  connection: Readonly<HttpConnection>
): Readonly<Transport> => {
  return new StreamableHTTPClientTransport(new URL(connection.url), {
    requestInit: {
      headers: connection.headers,
      signal: connection.timeout
        ? AbortSignal.timeout(connection.timeout)
        : undefined,
    },
  })
}

const createWsTransport = (
  connection: Readonly<WsConnection>
): Readonly<Transport> => {
  let ws: WebSocket | null = null
  let messageCallback:
    | ((
        message: Readonly<JSONRPCMessage>,
        extra?: { authInfo?: unknown }
      ) => void)
    | undefined
  let errorCallback: ((error: Error) => void) | undefined

  return {
    start: async () => {
      ws = new WebSocket(connection.url, {
        headers: connection.headers,
        protocols: connection.protocols,
      })

      ws.on('message', data => {
        try {
          const message = JSON.parse(data.toString()) as JSONRPCMessage
          messageCallback?.(message)
        } catch (error) {
          errorCallback?.(
            error instanceof Error ? error : new Error(String(error))
          )
        }
      })

      ws.on('error', error => {
        errorCallback?.(
          error instanceof Error ? error : new Error(String(error))
        )
      })

      return new Promise((resolve, reject) => {
        if (!ws) return reject(new Error('WebSocket not initialized'))
        ws.on('open', resolve)
        ws.on('error', reject)
      })
    },
    send: async (
      message: Readonly<JSONRPCMessage>,
      options?: Readonly<TransportSendOptions>
    ) => {
      if (!ws) {
        throw new Error('WebSocket not started')
      }
      ws.send(JSON.stringify(message))
    },
    close: async () => {
      if (ws) {
        ws.close()
        ws = null
      }
    },
    onmessage: undefined,
    onerror: undefined,
  }
}

const createTransport = (
  connection: Readonly<
    | SimpleCliConnection
    | RpcCliConnection
    | HttpConnection
    | WsConnection
    | ContainerPerRequestConnection
    | PersistentContainerConnection
  >
): Readonly<Transport> => {
  switch (connection.type) {
    case 'cli':
      return createCliTransport(connection)
    case 'cli-rpc':
      return createCliPersistentTransport(connection)
    case 'http':
      return createHttpTransport(connection)
    case 'ws':
      return createWsTransport(connection)
    case 'docker':
      return createDockerTransport(connection)
    default:
      throw new Error(
        `Unsupported connection type: ${(connection as any).type}`
      )
  }
}

const createSimpleCliClient = (transport: Transport) => {
  let toolList: McpTool[] = []

  // Set up message handler to capture tool list
  transport.onmessage = message => {
    if ('result' in message && message.result?.tools) {
      toolList = message.result.tools as McpTool[]
    }
  }

  return {
    connect: async () => {
      await transport.start()
    },
    close: async () => {
      await transport.close()
    },
    callTool: async ({
      name,
      input,
    }: {
      name: string
      input: Record<string, JsonAble>
    }) => {
      console.error('=== SIMPLE CLI CALL ===')
      console.error('Tool name:', name)
      console.error('Input:', JSON.stringify(input, null, 2))

      // Send input directly
      await transport.send({
        jsonrpc: '2.0',
        method: 'callTool',
        params: {
          name,
          input,
        },
        id: 1,
      })

      return { result: 'ok' }
    },
    listTools: async () => {
      console.error('=== SIMPLE CLI LIST TOOLS ===')

      // Send listTools request and wait for response
      await transport.send({
        jsonrpc: '2.0',
        method: 'listTools',
        params: {},
        id: 1,
      })

      // Return the captured tool list
      return { tools: toolList }
    },
  }
}

const createServerTransport = (config: ServerConfig): Transport => {
  switch (config.type) {
    case 'http': {
      return new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      })
    }
    case 'ws': {
      throw new Error('WebSocket server transport not yet implemented')
    }
    case 'cli':
    case 'cli-rpc': {
      return new StdioServerTransport()
    }
    default:
      throw new Error(`Unsupported server type: ${config.type}`)
  }
}

const create = (config: Readonly<McpAggregatorConfig>) => {
  const clients = new Map<
    string,
    Client | ReturnType<typeof createSimpleCliClient>
  >()
  const transports = new Map<string, Transport>()
  const toolLookup = new Map<string, { mcpId: string; tool: unknown }>()
  /*
  let server: Server | undefined

  const handleRequest = async (request: Request & { id: string | number }): Promise<Result> => {
    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          serverInfo: {
            name: 'mcp-aggregator',
            version: '0.0.1'
          },
          protocolVersion: '2024-11-05',
          capabilities: {
            toolUse: { enabled: true },
            toolList: { enabled: true },
            toolCall: { enabled: true }
          }
        }
      }
    }

    if (request.method === 'tools/list') {
      const tools = await getTools()
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: Array.from(tools.values()).flat() }
      }
    }

    if (request.method === 'tools/call') {
      const { name, input } = request.params as { name: string, input: Record<string, JsonAble> }
      const toolInfo = toolLookup.get(name)
      if (!toolInfo) {
        throw new Error(`Tool not found: ${name}`)
      }
      const result = await clients.get(toolInfo.mcpId)?.callTool({ name, input })
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      }
    }

    throw new Error(`Unknown method: ${request.method}`)
  }
  */

  const connect = async () => {
    /*
    // Create and start the server first if server config is provided
    if ('server' in config && config.server) {
      server = new Server({
        name: 'mcp-aggregator',
        version: '0.0.1'
      })
      const serverTransport = createServerTransport(config.server)
      await server.connect(serverTransport)
    }
    */

    // Then connect to all MCPs
    await Promise.all(
      config.mcps.map(async mcp => {
        const transport = createTransport(mcp.connection)

        if (mcp.connection.type === 'cli') {
          const client = createSimpleCliClient(transport)
          await client.connect()
          clients.set(mcp.id, client)
        } else {
          const client = new Client({
            name: 'mcp-aggregator',
            version: '0.0.1',
          })
          client.onerror = error => {
            console.error(`Error in MCP ${mcp.id}:`, error)
          }
          await client.connect(transport)
          clients.set(mcp.id, client)
        }

        transports.set(mcp.id, transport)

        // Build tool lookup map
        const tools = await clients.get(mcp.id)?.listTools()
        console.log(clients)
        console.log(mcp.id)
        console.log('Tools:', tools)
        if (tools?.tools) {
          for (const tool of tools.tools) {
            toolLookup.set(tool.name, { mcpId: mcp.id, tool })
          }
        }
      })
    )
  }

  const getTools = async (): Promise<readonly McpTool[]> => {
    return Array.from(toolLookup.values()).map(({ tool }) => tool as McpTool)
  }

  const executeTool = async (
    name: string,
    input: Readonly<Record<string, JsonAble>>
  ) => {
    const toolInfo = toolLookup.get(name)
    if (!toolInfo) {
      throw new Error(`Tool not found: ${name}`)
    }
    console.log("calling tool call")
    console.log(toolInfo.mcpId)
    console.log(name)
    console.log(input)
    const result = await clients.get(toolInfo.mcpId)?.callTool({ name, input })
    console.log("result", result)
    return result
  }

  const disconnect = async () => {
    // First disconnect all clients
    await Promise.all(
      Array.from(clients.values()).map(async client => {
        try {
          await client.close()
        } catch (error) {
          console.error('Error closing client:', error)
        }
      })
    )

    // Then close all transports
    await Promise.all(
      Array.from(transports.values()).map(async transport => {
        try {
          await transport.close()
        } catch (error) {
          console.error('Error closing transport:', error)
        }
      })
    )

    /*
    // Finally close the server
    if (server) {
      await server.close()
    }
    */

    // Clear the maps
    clients.clear()
    transports.clear()
    toolLookup.clear()
  }

  return {
    connect,
    disconnect,
    getTools,
    executeTool,
  }
}

export { create }
