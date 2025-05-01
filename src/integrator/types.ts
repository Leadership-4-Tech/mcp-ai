import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { McpIntegratorConfig, Provider } from '../common/types.js'

export type ToolFormat = Readonly<{
  name: string
  description?: string
  input_schema?: unknown
  type?: string
  function?: Readonly<{
    name: string
    description?: string
    parameters?: unknown
  }>
}>

export type ToolCall = Readonly<{
  name: string
  input: unknown
}>

export type ToolResult = unknown

export type Response = Readonly<Record<string, unknown>>

export type IntegratorService = Readonly<{
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getTools: () => Promise<readonly ToolFormat[]>
  formatToolsForProvider: (
    tools: readonly ToolFormat[]
  ) => readonly ToolFormat[]
  extractCallsFromProviderResponse: (response: Response) => readonly ToolCall[]
  executeToolCalls: (
    calls: readonly ToolCall[]
  ) => Promise<readonly ToolResult[]>
  combineProviderResponseWithResults: (
    response: Response,
    results: readonly ToolResult[]
  ) => Response
}>

export type CreateIntegratorService = (
  config: McpIntegratorConfig
) => IntegratorService

export type McpIntegrator = Readonly<{
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getTools: (provider: Provider) => Promise<readonly ToolFormat[]>
  extractCalls: (response: Response) => readonly ToolCall[]
  executeCalls: (calls: readonly ToolCall[]) => Promise<readonly ToolResult[]>
  combineResults: (
    response: Response,
    results: readonly ToolResult[]
  ) => Response
}>
