import {
  McpAggregatorConfig,
  McpAggregatorCliConfig,
  McpAggregatorSseConfig,
  McpAggregatorHttpConfig,
  ExpressOptions,
} from '../../common/types.js'

import { create as createCli } from './cli.js'
import { create as createSse } from './sse.js'
import { create as createHttp } from './http.js'

const create = (
  config: McpAggregatorConfig,
  options?: { express: ExpressOptions }
) => {
  switch (config.server.connection.type) {
    case 'cli':
      return createCli(config as McpAggregatorCliConfig)
    case 'sse':
      return createSse(config as McpAggregatorSseConfig, options?.express)
    case 'http':
      return createHttp(config as McpAggregatorHttpConfig, options?.express)
    default:
      throw new Error(
        `Unsupported server type: ${config.server.connection.type}`
      )
  }
}

export { create }
