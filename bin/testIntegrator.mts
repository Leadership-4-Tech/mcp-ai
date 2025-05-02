#!/usr/bin/env node --import tsx

import { OpenAI } from 'openai'
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import { create as createIntegratorFeatures } from '../src/integrator/features/index.js'
import { McpIntegratorConfig } from '../src/common/types.js'

const readConfig = (configPath: string) => {
  const configContent = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(configContent).integrator as McpIntegratorconfig 
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Test the MCP Integrator',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  parser.add_argument('message', {
    help: 'The message to the AI',
  })

  const args = parser.parse_args()
  const config = readConfig(args.config)
  const provider = 'OpenAi'
  const features = await createIntegratorFeatures(config)

  try {
    await features.connect()
    const tools = await features.getTools(provider)
    console.log("THE TOOLS")
    console.log(tools)

    const request = {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: args.message }
      ],
      tools: tools,
      tool_choice: "auto"
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log("CALLING OpenAI")
    console.log(JSON.stringify(request, null, 2))
    const response = await openai.chat.completions.create(request)
    console.log(JSON.stringify(response, null, 2))

    console.log("Extracting calls")
    const calls = features.extractCalls(response)
    console.log("Got the calls")
    console.log(JSON.stringify(calls, null, 2))
    if (calls && calls.length > 0) {
      console.log("Executing calls")
      const callResponses = await features.executeCalls(calls)
      console.log("The call responses")
      console.log(JSON.stringify(callResponses, null, 2))
      console.log("Combining results")
      const toReturn = features.combineResults(request, response, callResponses)
      console.log("Sending to the llm")
      console.log(JSON.stringify(toReturn, null, 2))
      console.log("Calling LLM")
      const finalResponse = await openai.chat.completions.create(toReturn)
      console.log(JSON.stringify(finalResponse, null, 2))
    } else {
      console.log("No calls were requested")
    }
  } finally {
    await features.disconnect()
  }
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

export { create }

import { OpenAI } from 'openai'
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import { create as createIntegratorFeatures } from '../src/integrator/features/index.js'
import { McpIntegratorConfig } from '../src/common/types.js'

const readConfig = (configPath: string) => {
  const configContent = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(configContent).integrator as McpIntegratorconfig 
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Test the MCP Integrator',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  parser.add_argument('message', {
    help: 'The message to the AI',
  })

  const args = parser.parse_args()
  const config = readConfig(args.config)
  const provider = 'OpenAi'
  const features = await createIntegratorFeatures(config)

  try {
    await features.connect()
    const tools = await features.getTools(provider)
    console.log("THE TOOLS")
    console.log(tools)

    const request = {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: args.message }
      ],
      tools: tools,
      tool_choice: "auto"
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log("CALLING OpenAI")
    console.log(JSON.stringify(request, null, 2))
    const response = await openai.chat.completions.create(request)
    console.log(JSON.stringify(response, null, 2))

    console.log("Extracting calls")
    const calls = features.extractCalls(response)
    console.log("Got the calls")
    console.log(JSON.stringify(calls, null, 2))
    if (calls && calls.length > 0) {
      console.log("Executing calls")
      const callResponses = await features.executeCalls(calls)
      console.log("The call responses")
      console.log(JSON.stringify(callResponses, null, 2))
      console.log("Combining results")
      const toReturn = features.combineResults(request, response, callResponses)
      console.log("Sending to the llm")
      console.log(JSON.stringify(toReturn, null, 2))
      console.log("Calling LLM")
      const finalResponse = await openai.chat.completions.create(toReturn)
      console.log(JSON.stringify(finalResponse, null, 2))
    } else {
      console.log("No calls were requested")
    }
  } finally {
    await features.disconnect()
  }
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

export { create }

import { OpenAI } from 'openai'
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import { create as createIntegratorFeatures } from '../src/integrator/features/index.js'
import { McpIntegratorConfig } from '../src/common/types.js'

const readConfig = (configPath: string) => {
  const configContent = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(configContent).integrator as McpIntegratorconfig 
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Test the MCP Integrator',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  parser.add_argument('message', {
    help: 'The message to the AI',
  })

  const args = parser.parse_args()
  const config = readConfig(args.config)
  const provider = 'OpenAi'
  const features = await createIntegratorFeatures(config)

  try {
    await features.connect()
    const tools = await features.getTools(provider)
    console.log("THE TOOLS")
    console.log(tools)

    const request = {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: args.message }
      ],
      tools: tools,
      tool_choice: "auto"
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log("CALLING OpenAI")
    console.log(JSON.stringify(request, null, 2))
    const response = await openai.chat.completions.create(request)
    console.log(JSON.stringify(response, null, 2))

    console.log("Extracting calls")
    const calls = features.extractCalls(response)
    console.log("Got the calls")
    console.log(JSON.stringify(calls, null, 2))
    if (calls && calls.length > 0) {
      console.log("Executing calls")
      const callResponses = await features.executeCalls(calls)
      console.log("The call responses")
      console.log(JSON.stringify(callResponses, null, 2))
      console.log("Combining results")
      const toReturn = features.combineResults(request, response, callResponses)
      console.log("Sending to the llm")
      console.log(JSON.stringify(toReturn, null, 2))
      console.log("Calling LLM")
      const finalResponse = await openai.chat.completions.create(toReturn)
      console.log(JSON.stringify(finalResponse, null, 2))
    } else {
      console.log("No calls were requested")
    }
  } finally {
    await features.disconnect()
  }
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

export { create }

import { OpenAI } from 'openai'
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import { create as createIntegratorFeatures } from '../src/integrator/features/index.js'
import { McpIntegratorConfig } from '../src/common/types.js'

const readConfig = (configPath: string) => {
  const configContent = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(configContent).integrator as McpIntegratorconfig 
}

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Test the MCP Integrator',
  })

  parser.add_argument('config', {
    help: 'Path to the configuration file',
  })

  parser.add_argument('message', {
    help: 'The message to the AI',
  })

  const args = parser.parse_args()
  const config = readConfig(args.config)
  const provider = 'OpenAi'
  const features = await createIntegratorFeatures(config)

  try {
    await features.connect()
    const tools = await features.getTools(provider)
    console.log("THE TOOLS")
    console.log(tools)

    const request = {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: args.message }
      ],
      tools: tools,
      tool_choice: "auto"
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log("CALLING OpenAI")
    console.log(JSON.stringify(request, null, 2))
    const response = await openai.chat.completions.create(request)
    console.log(JSON.stringify(response, null, 2))

    console.log("Extracting calls")
    const calls = features.extractCalls(response)
    console.log("Got the calls")
    console.log(JSON.stringify(calls, null, 2))
    if (calls && calls.length > 0) {
      console.log("Executing calls")
      const callResponses = await features.executeCalls(calls)
      console.log("The call responses")
      console.log(JSON.stringify(callResponses, null, 2))
      console.log("Combining results")
      const toReturn = features.combineResults(request, response, callResponses)
      console.log("Sending to the llm")
      console.log(JSON.stringify(toReturn, null, 2))
      console.log("Calling LLM")
      const finalResponse = await openai.chat.completions.create(toReturn)
      console.log(JSON.stringify(finalResponse, null, 2))
    } else {
      console.log("No calls were requested")
    }
  } finally {
    await features.disconnect()
  }
}

// Execute main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

export { create }
