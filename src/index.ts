import { create as createIntegrator } from './integrator/features.js'
import { create as createAggregator } from './aggregator/features.js'
import {
  McpIntegratorConfig,
  McpAggregatorConfig,
  McpIntegratorFullConfig,
} from './common/types.js'

export const name = 'mcp-integrator'

export const create = (
  config: Readonly<
    McpIntegratorConfig | McpAggregatorConfig | McpIntegratorFullConfig
  >
) => {
  if ('integrator' in config) {
    return createIntegrator(config.integrator)
  }
  if ('mcps' in config) {
    return createAggregator(config)
  }
  return createIntegrator(config)
}

export * as types from './common/types.js'
