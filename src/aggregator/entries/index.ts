import { 
  McpAggregatorConfig,
  McpAggregatorConfigWithCliServer,
  McpAggregatorConfigWithSseServer,
  McpAggregatorConfigWithHttpServer
} from '../../common/types.js'
import { create as createCli } from './cli.js'
import { create as createSse } from './sse.js'
import { create as createHttp } from './http.js'

const create = (config: McpAggregatorConfig) => {
  switch (config.server.connection.type) {
    case 'cli':
      return createCli(config as McpAggregatorConfigWithCliServer)
    case 'sse':
      return createSse(config as McpAggregatorConfigWithSseServer)
    case 'http':
      return createHttp(config as McpAggregatorConfigWithHttpServer)
    default:
      throw new Error(`Unsupported server type: ${config.server.connection.type}`)
  }
}

export { create } 