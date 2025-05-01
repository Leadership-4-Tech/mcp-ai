import { Server } from '@modelcontextprotocol/sdk/server'
import { create as createServices } from './services'
import { HelloWorldTransport } from './types'

const create = () => {
  const services = createServices()
  const server = new Server({
    name: 'hello-world-mcp',
    version: '0.0.1',
  })

  const start = async () => {
    await server.connect(services)
    return server
  }

  const stop = async () => {
    await server.close()
  }

  return {
    start,
    stop,
  }
}

export { create }
