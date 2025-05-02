#!/usr/bin/env -S node --import tsx

import { createChatIntegrator } from '../chatCode/integrator.js'
import { McpIntegratorConfig, Provider } from '../../src/common/types.js'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import inquirer from 'inquirer'

const parser = new ArgumentParser({
  description: 'Test the chat integrator with a specific configuration',
})

parser.add_argument('config', {
  help: 'Path to the configuration file',
})

const args = parser.parse_args()

const getConfig = (configPath: string): McpIntegratorConfig => {
  const config = fs.readFileSync(configPath, 'utf8')
  return JSON.parse(config).integrator as McpIntegratorConfig
}

async function main() {
  const config = getConfig(args.config)

  // Initialize clients based on provider
  let client: any
  switch (config.provider) {
    case Provider.OpenAI:
      client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      break
    case Provider.Claude:
      client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
      break
    case Provider.AwsBedrockClaude:
      client = new BedrockRuntimeClient()
      break
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }

  // Create and initialize the chat integrator
  const integrator = await createChatIntegrator(config, client)

  try {
    console.log('Chat started. Type "exit" or "quit" to end the conversation.')
    console.log('----------------------------------------')

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'You:',
        },
      ])

      if (
        message.toLowerCase() === 'exit' ||
        message.toLowerCase() === 'quit'
      ) {
        break
      }

      const response = await integrator.sendMessage(message)
      console.log('\nAssistant:', response)
    }

    console.log('\nChat ended. Goodbye!')
  } finally {
    // Clean up
    await integrator.disconnect()
  }
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}
