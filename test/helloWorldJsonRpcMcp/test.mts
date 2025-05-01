#!/usr/bin/env tsx

import { features } from '../../src/aggregator'
import { readFile } from 'fs/promises'

const main = async () => {
  // Read the config
  const configContent = await readFile(
    './test/helloWorldMcp/config.json',
    'utf-8'
  )
  const config = JSON.parse(configContent)

  // Create and start the aggregator
  const aggregator = features.create(config)
  await aggregator.initialize()

  // Get available tools
  const tools = await aggregator.getTools()
  console.log('Available tools:', tools)

  // Execute the hello tool
  const result = await aggregator.executeTool('hello-world', 'hello', {
    name: 'World',
  })
  console.log('Tool result:', result)

  // Clean up
  await aggregator.dispose()
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}

export { main }
