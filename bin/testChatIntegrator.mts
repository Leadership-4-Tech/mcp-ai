#!/usr/bin/env tsx 

import { createChatIntegrator } from '../src/chat/integrator.js'
import { McpIntegratorConfig, Provider } from '../src/common/types.js'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

const config: McpIntegratorConfig = {
  connection: {
    type: 'http',
    url: 'http://localhost:3000'
  },
  provider: Provider.OpenAI,
  maxParallelCalls: 3
}

async function main() {
  // Initialize clients based on provider
  let client: any
  switch (config.provider) {
    case Provider.OpenAI:
      client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      break
    case Provider.Claude:
      client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
      break
    case Provider.AwsBedrockClaude:
      client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
      })
      break
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }

  // Create and initialize the chat integrator
  const integrator = await createChatIntegrator(config, client)

  try {
    // Test sending a message
    const response = await integrator.sendMessage("Hello, how are you?")
    console.log("Response:", response)

    // Test sending another message
    const followUp = await integrator.sendMessage("What can you do?")
    console.log("Follow-up:", followUp)
  } finally {
    // Clean up
    await integrator.disconnect()
  }
}

main().catch(console.error)

