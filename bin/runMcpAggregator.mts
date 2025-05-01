#!/usr/bin/env node --import tsx

import { readFile } from 'fs/promises'
import { ArgumentParser } from 'argparse'
import { features } from '../src/aggregator/index.js'
import { McpAggregatorConfig } from '../src/common/types.js'

type AggregatorCliConfig = Readonly<{
  configPath: string
}>

const create = (config: AggregatorCliConfig) => {
  const readConfig = async () => {
    const configContent = await readFile(config.configPath, 'utf-8')
    return JSON.parse(configContent) as McpAggregatorConfig
  }

  const start = async () => {
    const mcpConfig = await readConfig()
    const aggregator = features.create(mcpConfig)
    await aggregator.initialize()
    return aggregator
  }

  return {
    start,
  }
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'MCP Aggregator Server',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  const args = parser.parse_args()
  const config: AggregatorCliConfig = {
    configPath: args.config,
  }

  const aggregator = create(config)
  await aggregator.start()
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start aggregator:', error)
    process.exit(1)
  })
}

export { create }
