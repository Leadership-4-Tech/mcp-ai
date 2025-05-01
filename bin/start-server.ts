#!/usr/bin/env node --import tsx

import { readFile } from 'fs/promises'
import { ArgumentParser } from 'argparse'
import { create as createHttpServer } from '../src/aggregator/entries/http.js'
import { McpAggregatorConfig } from '../src/common/types.js'

type ServerCliConfig = Readonly<{
  configPath: string
  port: number
}>

const create = (config: ServerCliConfig) => {
  const readConfig = async () => {
    const configContent = await readFile(config.configPath, 'utf-8')
    return JSON.parse(configContent) as McpAggregatorConfig
  }

  const start = async () => {
    const mcpConfig = await readConfig()
    const server = await createHttpServer(mcpConfig)
    const port = config.port
    await server.start(port)
    return server
  }

  return {
    start,
  }
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'MCP Aggregator HTTP Server',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  parser.add_argument('--port', {
    help: 'Port to listen on (default: 3000)',
    type: 'int',
    required: false,
    default: 3000,
  })

  const args = parser.parse_args()
  const config: ServerCliConfig = {
    configPath: args.config,
    port: args.port,
  }

  const server = create(config)
  const httpServer = await server.start()

  console.log('Press Ctrl+C to stop the server')

  // Keep the process running until interrupted
  const keepAlive = () => {
    // This will keep the process running until interrupted
    process.stdin.resume()
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await httpServer.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...')
    await httpServer.stop()
    process.exit(0)
  })

  keepAlive()
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

export { create }
