#!/usr/bin/env node

import { ArgumentParser } from 'argparse'
import { readFileSync } from 'fs'
import { createChatIntegrator } from '../chatCode/integrator.js'
import { Provider } from '../../src/common/types.js'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

async function main() {
  const parser = new ArgumentParser({
    description:
      'An aggregator and integrator test to List available tools using MCPs and an LLM over HTTP. This is intended to be run from the main directory.',
  })
  parser.add_argument('config', {
    type: 'str',
  })

  const args = parser.parse_args()

  try {
    // Read and parse the config file
    const config = JSON.parse(readFileSync(args.config, 'utf-8')).integrator

    // Initialize client based on provider
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
      // Send the message to list tools
      const response = await integrator.sendMessage('List available tools')

      // Print the response
      console.info('\nResponse:', response)
    } finally {
      // Clean up
      await integrator.disconnect()
    }
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
