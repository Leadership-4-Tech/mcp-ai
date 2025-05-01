import { Provider } from '../../common/types.js'
import { create as createServices } from '../services.js'
import { McpIntegratorConfig } from '../../common/types.js'
import {
  McpIntegrator,
  ToolFormat,
  Response,
  ToolCall,
  ToolResult,
} from '../types.js'

const create = (config: McpIntegratorConfig): McpIntegrator => {
  const services = createServices(config)

  const connect = async () => {
    await services.connect()
  }

  const disconnect = async () => {
    await services.disconnect()
  }

  const getTools = async (
    provider: Provider
  ): Promise<Readonly<ToolFormat[]>> => {
    const tools = await services.getTools()
    return services.formatToolsForProvider(tools)
  }

  const extractCalls = (response: Response): Readonly<ToolCall[]> => {
    return services.extractCallsFromProviderResponse(response)
  }

  const executeCalls = async (
    calls: Readonly<ToolCall[]>
  ): Promise<Readonly<ToolResult[]>> => {
    return services.executeToolCalls(calls)
  }

  const combineResults = (
    response: Response,
    results: Readonly<ToolResult[]>
  ): Response => {
    return services.combineProviderResponseWithResults(response, results)
  }

  return {
    connect,
    disconnect,
    getTools,
    extractCalls,
    executeCalls,
    combineResults,
  }
}

export { create }
