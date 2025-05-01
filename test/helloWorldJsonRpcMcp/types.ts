import {
  JSONRPCMessage,
  Request,
  Notification,
  Result,
} from '@modelcontextprotocol/sdk/types'
import {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport'

export type HelloWorldToolInput = Readonly<{
  name: string
}>

export type HelloWorldToolResult = Readonly<{
  message: string
}>

export type HelloWorldTransport = Readonly<Transport>
