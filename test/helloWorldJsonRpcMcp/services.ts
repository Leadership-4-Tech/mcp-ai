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
import {
  HelloWorldToolInput,
  HelloWorldToolResult,
  HelloWorldTransport,
} from './types'

const create = (): HelloWorldTransport => {
  let messageCallback:
    | ((
        message: Readonly<JSONRPCMessage>,
        extra?: { authInfo?: unknown }
      ) => void)
    | undefined
  let errorCallback: ((error: Error) => void) | undefined

  const handleRequest = async (request: Readonly<Request>): Promise<Result> => {
    console.error('=== HANDLING REQUEST ===')
    console.error('Request:', JSON.stringify(request, null, 2))
    console.error('Request method:', request.method)
    console.error('Request params:', JSON.stringify(request.params, null, 2))

    if (request.method === 'initialize') {
      console.error('>>> Processing initialize request')
      const result = {
        id: request.id,
        result: {
          serverInfo: {
            name: 'hello-world-mcp',
            version: '0.0.1',
          },
          capabilities: {},
        },
      }
      console.error('<<< Initialize response:', JSON.stringify(result, null, 2))
      return result
    }

    if (request.method === 'listTools') {
      console.error('>>> Processing listTools request')
      const result = {
        id: request.id,
        result: {
          tools: [
            {
              name: 'hello',
              description: 'Says hello to someone',
              parameters: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name of the person to greet',
                  },
                },
                required: ['name'],
              },
            },
          ],
        },
      }
      console.error('<<< ListTools response:', JSON.stringify(result, null, 2))
      return result
    }

    if (request.method === 'hello') {
      console.error('>>> Processing hello request')
      console.error('Input:', JSON.stringify(request.params, null, 2))
      const input = request.params as HelloWorldToolInput
      const result: HelloWorldToolResult = {
        message: `Hello ${input.name}`,
      }
      const response = {
        id: request.id,
        result,
      }
      console.error('<<< Hello response:', JSON.stringify(response, null, 2))
      return response
    }

    console.error('!!! Unknown method:', request.method)
    throw new Error(`Unknown method: ${request.method}`)
  }

  // Write responses to stdout
  const writeResponse = (message: Readonly<JSONRPCMessage>) => {
    console.error('=== SENDING RESPONSE ===')
    console.error('Response:', JSON.stringify(message, null, 2))
    const messageStr = JSON.stringify(message) + '\n'
    console.error('Writing to stdout:', messageStr)
    const success = process.stdout.write(messageStr)
    if (!success) {
      console.error('>>> Buffer full, waiting for drain')
      process.stdout.once('drain', () => {
        console.error('>>> Buffer drained')
      })
    } else {
      console.error('>>> Response sent successfully')
    }
  }

  return {
    start: async () => {
      console.error('=== TRANSPORT STARTING ===')
      return Promise.resolve()
    },
    send: async (
      message: Readonly<JSONRPCMessage>,
      options?: Readonly<TransportSendOptions>
    ) => {
      console.error('=== MESSAGE RECEIVED ===')
      console.error('Message:', JSON.stringify(message, null, 2))
      console.error(
        'Message type:',
        'method' in message ? 'Request' : 'Response'
      )
      if ('method' in message) {
        console.error('Processing request with method:', message.method)
        const result = await handleRequest(message as Request)
        writeResponse(result)
      } else {
        console.error('Received response, not processing')
      }
    },
    close: async () => {
      console.error('=== TRANSPORT CLOSING ===')
      return Promise.resolve()
    },
    onmessage: callback => {
      console.error('>>> Setting message callback')
      messageCallback = callback
    },
    onerror: callback => {
      console.error('>>> Setting error callback')
      errorCallback = callback
    },
  }
}

export { create }
