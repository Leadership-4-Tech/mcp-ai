import {
  StreamableHTTPClientTransport,
  StreamableHTTPClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Connection } from './types.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

export const toMcpConfig = (
  connection: Connection
): StreamableHTTPClientTransportOptions => {
  if (connection.type === 'http') {
    return {
      requestInit: {
        headers: connection.headers,
        signal: connection.timeout
          ? AbortSignal.timeout(connection.timeout)
          : undefined,
      },
      reconnectionOptions: connection.retry
        ? {
            maxReconnectionDelay: connection.retry.backoff,
            initialReconnectionDelay: 1000,
            reconnectionDelayGrowFactor: 1.5,
            maxRetries: connection.retry.attempts,
          }
        : undefined,
    }
  }
  throw new Error(`Unsupported connection type: ${connection.type}`)
}

export const createTransport = (connection: Connection) => {
  if (connection.type === 'http') {
    return new StreamableHTTPClientTransport(new URL(connection.url))
  }
  if (connection.type === 'ws') {
    return new WebSocketClientTransport(new URL(connection.url))
  }
  if (connection.type === 'cli') {
    return new StdioClientTransport({
      command: connection.path,
      args: connection.args,
      env: connection.env,
      cwd: connection.cwd,
    })
  }
  if (connection.type === 'sse') {
    return new SSEClientTransport(new URL(connection.url))
  }
  throw new Error(`Unsupported connection type: ${(connection as { type: string }).type}`)
}

