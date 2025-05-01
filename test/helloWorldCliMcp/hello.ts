#!/usr/bin/env node

// CLI tool that speaks JSON-RPC over stdin/stdout or command line args
// Can handle multiple tools

const readStdin = async (): Promise<string> => {
  return new Promise(resolve => {
    let data = ''
    process.stdin.on('data', chunk => {
      data += chunk
    })
    process.stdin.on('end', () => {
      resolve(data)
    })
  })
}

const handleInitialize = (message: any) => {
  return {
    jsonrpc: '2.0',
    id: message.id,
    result: {
      serverInfo: {
        name: 'hello-world-cli',
        version: '0.0.1',
      },
      capabilities: {},
    },
  }
}

const handleListTools = (message: any) => {
  return {
    jsonrpc: '2.0',
    id: message.id,
    result: {
      tools: [
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
      ],
    },
  }
}

const handleHello = (message: any) => {
  return {
    jsonrpc: '2.0',
    id: message.id,
    result: {
      result: `Hello, ${message.params.input.name}!`,
    },
  }
}

const handleGoodbye = (message: any) => {
  return {
    jsonrpc: '2.0',
    id: message.id,
    result: {
      result: `Goodbye, ${message.params.input.name}!`,
    },
  }
}

const main = async () => {
  try {
    // Get input from either stdin or command line args
    let inputStr: string
    if (process.argv.length > 2) {
      // Command line arg mode
      inputStr = process.argv[2]
    } else {
      // Stdin mode
      inputStr = await readStdin()
    }

    console.error('=== CLI TOOL DEBUG ===')
    console.error('Raw input:', inputStr)

    if (!inputStr) {
      console.error('No input received')
      process.exit(1)
    }

    const message = JSON.parse(inputStr)
    console.error('Parsed message:', JSON.stringify(message, null, 2))

    let response
    switch (message.method) {
      case 'initialize':
        response = handleInitialize(message)
        break
      case 'listTools':
        response = handleListTools(message)
        break
      case 'callTool':
        if (message.params.name === 'hello') {
          response = handleHello(message)
        } else if (message.params.name === 'goodbye') {
          response = handleGoodbye(message)
        } else {
          throw new Error(`Unknown tool: ${message.params.name}`)
        }
        break
      default:
        throw new Error(`Unknown method: ${message.method}`)
    }

    console.error('Response:', JSON.stringify(response, null, 2))
    console.log(JSON.stringify(response))
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
