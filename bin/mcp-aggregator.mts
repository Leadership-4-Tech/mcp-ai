#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { parseArgs } from 'node:util'
import { create } from '../src/aggregator/entries/index.ts'

async function main() {
  try {
    const { values, positionals } = parseArgs({
      options: {
        cursor: {
          type: 'boolean',
          short: 'c',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
        version: {
          type: 'boolean',
          short: 'v',
        },
      },
      allowPositionals: true,
    })

    if (values.help || positionals.length === 0) {
      console.info(`
Usage: mcp-aggregator [options] <config-file>

Launches an MCP Aggregator server according to the configuration passed in.

Options:
  -c, --cursor   Sets the mode for cursor support
  -h, --help     Show this help message
  -v, --version  Show version information

Arguments:
  config-file    Path to the configuration file (required)
`)
      process.exit(0)
    }

    if (values.version) {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
      console.info(`mcp-aggregator v${packageJson.version}`)
      process.exit(0)
    }

    // Get config file path
    const configPath = positionals[0]
    if (!configPath) {
      console.error('Error: Configuration file path is required')
      process.exit(1)
    }

    const fullConfig = JSON.parse(readFileSync(configPath, 'utf-8'))

    // Extract aggregator config - use the whole config if no aggregator property
    const config = fullConfig.aggregator ? fullConfig.aggregator : fullConfig
    const finalConfig = Object.assign(config, {
      cursor: values.cursor,
    })

    // Create and start the server
    const server = create(finalConfig)

    // Handle process termination
    process.on('SIGINT', async () => {
      console.info('Shutting down...')
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

main()
