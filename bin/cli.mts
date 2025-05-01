import { create } from '../src/aggregator/services/index.js'
import { readFile } from 'fs/promises'
import { Command } from 'commander'

async function main() {
  const program = new Command()

  program
    .requiredOption('--config <path>', 'Path to config file')
    .requiredOption('--mcpId <id>', 'MCP ID to use')
    .requiredOption('--input <json>', 'Input JSON for the tool')
    .parse(process.argv)

  const options = program.opts()

  // Read and parse config
  const configStr = await readFile(options.config, 'utf-8')
  const config = JSON.parse(configStr)

  // Create aggregator
  const aggregator = await create(config)

  // Connect to all MCPs
  await aggregator.connect()

  // Get list of tools
  console.log('Getting tools...')
  const tools = await aggregator.getTools()
  console.log(
    'Available tools:',
    JSON.stringify(Array.from(tools.entries()), null, 2)
  )

  // Parse input
  const input = JSON.parse(options.input)

  // Call both tools
  console.log('\nCalling hello tool...')
  const helloResult = await aggregator.executeTool(
    options.mcpId,
    'hello',
    input
  )
  console.log('Hello result:', JSON.stringify(helloResult, null, 2))

  console.log('\nCalling goodbye tool...')
  const goodbyeResult = await aggregator.executeTool(
    options.mcpId,
    'goodbye',
    input
  )
  console.log('Goodbye result:', JSON.stringify(goodbyeResult, null, 2))

  // Cleanup
  await aggregator.disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
