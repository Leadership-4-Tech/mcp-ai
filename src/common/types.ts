import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js'

export type JsonAble =
  | string
  | number
  | boolean
  | null
  | JsonAble[]
  | { [key: string]: JsonAble }

export type McpConfig = Readonly<{
  transport: Transport
  capabilities?: ClientCapabilities
}>

export enum Provider {
  Claude = 'claude',
  OpenAI = 'openai',
  AwsBedrockClaude = 'aws-bedrock-claude',
}

export type McpTool = Readonly<{
  name: string
  description?: string
  inputSchema: Readonly<{
    type: 'object'
    properties?: Readonly<Record<string, unknown>>
  }>
}>

export type SimpleCliConnection = Readonly<{
  type: 'cli'
  path: string
  args?: string[]
  env?: Readonly<Record<string, string>>
  cwd?: string
}>

export type RpcCliConnection = Readonly<{
  type: 'cli-rpc'
  path: string
  args?: string[]
  env?: Readonly<Record<string, string>>
  cwd?: string
}>

export type Connection = Readonly<
  | SimpleCliConnection
  | RpcCliConnection
  | HttpConnection
  | WsConnection
  | DockerConnection
>

export type HttpConnection = Readonly<{
  type: 'http'
  url: string
  headers?: Readonly<Record<string, string>>
  timeout?: number
  retry?: Readonly<{
    attempts: number
    backoff: number
  }>
}>

export type WsConnection = Readonly<{
  type: 'ws'
  url: string
  protocols?: Readonly<string[]>
  headers?: Readonly<Record<string, string>>
  reconnect?: Readonly<{
    attempts: number
    backoff: number
  }>
}>

export type DockerExecutionStrategy =
  | 'container-per-request'
  | 'persistent-container'

export type DockerVolume = Readonly<{
  hostPath: string
  containerPath: string
  mode?: 'ro' | 'rw'
}>

export type DockerCommonOptions = Readonly<{
  autoRemove?: boolean
  network?: string
  volumes?: Readonly<DockerVolume[]>
}>

export type ContainerPerRequestOptions = Readonly<{
  tty?: boolean
  attachStdin?: boolean
  attachStdout?: boolean
  attachStderr?: boolean
}>

export type PersistentContainerOptions = Readonly<{
  restartPolicy?: 'no' | 'always' | 'unless-stopped' | 'on-failure'
  healthCheck?: Readonly<{
    test: string[]
    interval?: number
    timeout?: number
    retries?: number
    startPeriod?: number
  }>
}>

export type ContainerPerRequestConnection = Readonly<{
  type: 'docker'
  strategy: 'container-per-request'
  image: string
  command?: Readonly<string[]>
  env?: Readonly<Record<string, string>>
  options?: Readonly<
    DockerCommonOptions & {
      containerPerRequest: ContainerPerRequestOptions
    }
  >
}>

export type PersistentContainerConnection = Readonly<{
  type: 'docker'
  strategy: 'persistent-container'
  image: string
  command?: Readonly<string[]>
  env?: Readonly<Record<string, string>>
  options?: Readonly<
    DockerCommonOptions & {
      persistentContainer: PersistentContainerOptions
    }
  >
}>

export type DockerConnection =
  | ContainerPerRequestConnection
  | PersistentContainerConnection

export type McpIntegratorConfig = Readonly<{
  connection: Connection
  provider: Provider
  maxParallelCalls?: number
}>

export type ServerConfig = Readonly<{
  type: 'http' | 'ws' | 'cli' | 'cli-rpc'
}>

export type McpAggregatorConfig = Readonly<{
  server?: ServerConfig
  mcps: Readonly<
    Readonly<{
      id: string
      connection: Connection
    }>[]
  >
  maxParallelCalls?: number
}>

export type McpIntegratorFullConfig = Readonly<{
  integrator: McpIntegratorConfig
  aggregator: McpAggregatorConfig
}>
