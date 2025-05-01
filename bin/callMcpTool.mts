#!/usr/bin/env tsx

import { readFile } from 'fs/promises'
import { ArgumentParser } from 'argparse'
import { features } from '../src/aggregator'
import { McpAggregatorConfig } from '../src/common/types'

type ToolCallConfig = Readonly<{
  configPath: string
  mcpId: string
  toolName: string
  input: string
}>

const create = (config: ToolCallConfig) => {
  const readConfig = async () => {
    console.error('Reading config from:', config.configPath)
    const configContent = await readFile(config.configPath, 'utf-8')
    const parsedConfig = JSON.parse(configContent) as McpAggregatorConfig
    console.error('Config loaded:', JSON.stringify(parsedConfig, null, 2))
    return parsedConfig
  }

  const callTool = async () => {
    console.error('Starting tool call process...')
    const mcpConfig = await readConfig()

    console.error('Creating aggregator...')
    const aggregator = features.create(mcpConfig)

    console.error('Initializing aggregator...')
    await aggregator.initialize()
    console.error('Aggregator initialized')

    try {
      console.error('Parsing input:', config.input)
      const input = JSON.parse(config.input)
      console.error('Calling tool:', {
        mcpId: config.mcpId,
        toolName: config.toolName,
        input,
      })

      const result = await aggregator.executeTool(
        config.mcpId,
        config.toolName,
        input
      )
      console.error('Tool call completed')
      console.log(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Error during tool call:', error)
      throw error
    } finally {
      console.error('Disposing aggregator...')
      await aggregator.dispose()
      console.error('Aggregator disposed')
    }
  }

  return {
    callTool,
  }
}

const main = async () => {
  console.error('Starting tool caller...')

  const parser = new ArgumentParser({
    description: 'Call an MCP tool through the aggregator',
  })

  parser.add_argument('--config', {
    help: 'Path to the configuration file',
    required: true,
  })

  parser.add_argument('--mcp-id', {
    help: 'ID of the MCP to call',
    required: true,
  })

  parser.add_argument('--tool', {
    help: 'Name of the tool to call',
    required: true,
  })

  parser.add_argument('--input', {
    help: 'JSON input for the tool',
    required: true,
  })

  const args = parser.parse_args()
  console.error('Parsed arguments:', args)

  const config: ToolCallConfig = {
    configPath: args.config,
    mcpId: args.mcp_id,
    toolName: args.tool,
    input: args.input,
  }
  console.error('Created config:', config)

  const toolCaller = create(config)
  await toolCaller.callTool()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to call tool:', error)
    process.exit(1)
  })
}

export { create }
