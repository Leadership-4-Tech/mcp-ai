import {
  ServerHttpConfig,
  ServerWsConfig,
  ServerCliConfig,
  ServerSseConfig,
  McpTool,
} from '../common/types'

/**
 * The value or an array of the types of value
 */
type Arrayable<T> = T | readonly T[]

/**
 * A JSON compliant object.
 */
type JsonObj = Readonly<{
  [s: string]: JsonAble | null | undefined
}>

/**
 * A description of valid json values.
 */
export type JsonAble =
  | Arrayable<JsonObj>
  | readonly (number | string | boolean)[]
  | number
  | string
  | boolean
  | null
  | undefined

export type ServerTool = McpTool &
  Readonly<{
    /**
     * An execute function that returns your native type. This is automatically converted to
     * the correct format for MCP as a stringified JSON.
     */
    execute: (input: any) => Promise<JsonAble>
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
