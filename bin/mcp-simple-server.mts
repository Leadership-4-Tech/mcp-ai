#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { parseArgs } from 'node:util'
import { create } from '../src/simple-server/entries/index.ts'

async function main() {
  try {
    const { values, positionals } = parseArgs({
      options: {
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
Usage: mcp-simple-server [options] <config-file>

Launches an MCP Simple Server according to the configuration passed in.

Options:
  -h, --help     Show this help message
  -v, --version  Show version information

Arguments:
  config-file    Path to the configuration file (required)
`)
      process.exit(0)
    }

    if (values.version) {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
      console.info(`mcp-simple-server v${packageJson.version}`)
      process.exit(0)
    }

    // Get config file path
    const configPath = positionals[0]
    if (!configPath) {
      console.error('Error: Configuration file path is required')
      process.exit(1)
    }

    const fullConfig = JSON.parse(readFileSync(configPath, 'utf-8'))

    // Extract server config - use the whole config if no "server" property
    const config = fullConfig.server ? fullConfig.server : fullConfig

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
