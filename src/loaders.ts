import * as fs from 'node:fs'
import { 
  Provider, 
  McpIntegration,
  McpIntegrationConfig,
} from './types'
import {
  createClaudeIntegration,
  createOpenAIIntegration,
  createBedrockIntegration,
} from './integrations'

const readConfigFromFile = <P extends Provider> (
  filePath: string,
) : McpIntegrationConfig => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContent) as McpIntegrationConfig
  } catch (error) {
    throw new Error(
      `Failed to read configuration file: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export function loadFromConfig<P extends Provider>(
  config: McpIntegrationConfig,
  providerType: P
): McpIntegration<P> {
  switch (providerType) {
    case Provider.Claude:
      return createClaudeIntegration(config) as McpIntegration<P>
    case Provider.OpenAI:
      return createOpenAIIntegration(config) as McpIntegration<P>
    case Provider.Bedrock:
      return createBedrockIntegration(config) as McpIntegration<P>
    default:
      throw new Error(`Unsupported provider type: ${providerType}`)
  }
}

export async function loadFromFile<P extends Provider>(
  filePath: string,
  providerType: P
): Promise<McpIntegration<P>> {
  const config = await readConfigFromFile(filePath)
  return loadFromConfig(config, providerType)
}
