import {
  ServerHttpConfig,
  ServerWsConfig,
  ServerCliConfig,
  ServerSseConfig,
  McpTool,
} from '../common/types'

export type ServerTool = McpTool &
  Readonly<{
    execute: (input: any) => Promise<any>
  }>

/**
 * The basic configuration for the MCP server
 */
type SimpleServerBasicConfig = Readonly<{
  /*
   * The name of the MCP server
   */
  name: string
  /*
   * The version of the MCP server
   */
  version: string
  /*
   * The tools of the server
   */
  tools: readonly ServerTool[]
}>

export type SimpleServerHttpConfig = ServerHttpConfig & SimpleServerBasicConfig
export type SimpleServerWsConfig = ServerWsConfig & SimpleServerBasicConfig
export type SimpleServerCliConfig = ServerCliConfig & SimpleServerBasicConfig
export type SimpleServerSseConfig = ServerSseConfig & SimpleServerBasicConfig

export type SimpleServerConfig =
  | SimpleServerHttpConfig
  | SimpleServerWsConfig
  | SimpleServerCliConfig
  | SimpleServerSseConfig
