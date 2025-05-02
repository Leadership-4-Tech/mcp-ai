#!/usr/bin/env tsx

import { ArgumentParser } from 'argparse'
import { readFileSync } from 'fs'
import { create } from '../src/aggregator/entries/index.js'

async function main() {
  const parser = new ArgumentParser({
    description:
      'Launches an MCP Aggregator server according to the configuration passed in.',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  const args = parser.parse_args()

  try {
    // Read and parse the config file
    const fullConfig = JSON.parse(readFileSync(args.config, 'utf-8'))

    // Extract aggregator config - use the whole config if no aggregator property
    const config = fullConfig.aggregator ? fullConfig.aggregator : fullConfig

    // Create and start the server
    const server = create(config)

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down...')
      await server.stop()
      process.exit(0)
    })

    // Start the server
    await server.start()
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : 'Unknown error occurred'
    )
    process.exit(1)
  }
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('An error occurred:', error)
    process.exit(1)
  })
}
