#!/usr/bin/env tsx

import { spawn } from 'child_process'
import { createInterface } from 'readline'

const main = async () => {
  console.error('Starting MCP server...')
  const server = spawn('tsx', ['./test/helloWorldMcp/run.mts'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  })

  // Create readline interface for reading stdout
  const rl = createInterface({
    input: server.stdout!,
    crlfDelay: Infinity,
  })

  // Handle server stdout
  rl.on('line', line => {
    console.error('Server stdout:', line)
    try {
      const message = JSON.parse(line)
      console.error('Parsed message:', JSON.stringify(message, null, 2))
    } catch (e) {
      console.error('Non-JSON output:', line)
    }
  })

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Send hello request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'hello',
    params: {
      name: 'World',
    },
  }

  console.error('Sending request:', JSON.stringify(request, null, 2))
  server.stdin!.write(JSON.stringify(request) + '\n')

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Cleanup
  server.kill()
  rl.close()
}

main().catch(console.error)
