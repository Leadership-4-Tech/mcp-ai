import {
  StreamableHTTPClientTransport,
  StreamableHTTPClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Connection } from './types.js'

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
