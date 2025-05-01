# MCP SDK Migration Plan

## Overview

This document outlines the plan to migrate our tool integration library to use the Model Context Protocol (MCP) SDK. The system consists of two main components:

1. **mcp-integrator (Library)**: Used by applications to handle LLM tool calls
2. **mcp-integrator-aggregator**: Acts as a single MCP endpoint that routes to other MCPs

The flow is:

```
Application Code -> mcp-integrator (lib) -> mcp-integrator-aggregator -> MCPs
```

## Current Architecture

Our current library provides:

- Tool definition and configuration
- Provider-specific integrations (Claude, OpenAI, Bedrock)
- Tool execution and response handling
- Parallel execution capabilities

## MCP Integration Architecture

### 1. Core Types

#### MCP Connection Types

```typescript
type CliConnection = {
  type: 'cli'
  path: string
}

type HttpConnection = {
  type: 'http'
  url: string
  headers?: Record<string, string>
  timeout?: number
  retry?: {
    attempts: number
    backoff: number
  }
}

type WsConnection = {
  type: 'ws'
  url: string
  protocols?: string[]
  headers?: Record<string, string>
  reconnect?: {
    attempts: number
    backoff: number
  }
}

type DockerConnection = {
  type: 'docker'
  image: string
  command?: string[]
  env?: Record<string, string>
}

type Connection =
  | CliConnection
  | HttpConnection
  | WsConnection
  | DockerConnection
```

#### Library Configuration

```typescript
type McpIntegratorConfig = {
  // Connection to MCP server
  connection: Connection

  // Optional settings
  maxParallelCalls?: number
}
```

#### Aggregator Configuration

```typescript
type McpIntegratorAggregatorConfig = {
  // MCPs to route to
  mcps: {
    id: string
    connection: Connection
  }[]
}
```

#### Combined Configuration

```typescript
type McpIntegratorFullConfig = {
  integrator: McpIntegratorConfig
  aggregator: McpIntegratorAggregatorConfig
}
```

## Migration Steps

### Phase 1: Server Integration

1. Implement MCP server using MCP SDK
2. Create tool routing system
3. Implement MCP aggregation
4. Add CLI and TCP server support

### Phase 2: Library Integration

1. Implement MCP client using MCP SDK
2. Keep provider-specific tool formatting
3. Update Claude integration to use MCP
4. Update OpenAI integration to use MCP
5. Update AWS Bedrock Claude integration to use MCP

### Phase 3: Tool Execution

1. Use MCP SDK for tool execution
2. Add parallel execution support
3. Implement error handling and retries
4. Add logging and monitoring

### Phase 4: Documentation and Testing

1. Update API documentation
2. Create migration guide
3. Add MCP-specific examples
4. Update tests to use MCP

## Key Changes

### 1. Server

- Implement MCP server using MCP SDK
- Create tool routing system
- Support multiple MCP types (CLI, TCP)
- Handle MCP aggregation

### 2. Library

- Use MCP SDK for tool execution
- Keep provider-specific tool formatting
- Implement parallel execution
- Handle LLM communication

### 3. Error Handling

- Use MCP SDK's error handling
- Add retry mechanisms
- Improve error reporting
- Handle MCP aggregation errors

## Backward Compatibility

To maintain backward compatibility:

1. Keep existing configuration formats
2. Keep provider-specific tool formatting
3. Add deprecation warnings
4. Provide migration utilities
5. Document breaking changes

## Testing Strategy

1. Unit Tests

   - Test server routing
   - Test library integration
   - Test provider-specific formatting
   - Check error handling

2. Integration Tests

   - Test with MCP servers
   - Test with LLM providers
   - Test MCP aggregation
   - Verify provider integration

3. Performance Tests
   - Measure latency
   - Check parallel execution
   - Monitor resource usage
   - Test MCP aggregation performance

## Timeline

1. Week 1-2: Server Integration
2. Week 3-4: Library Integration
3. Week 5: Tool Execution
4. Week 6: Documentation and Testing

## Dependencies

- @modelcontextprotocol/sdk
- Modern-async (for parallel execution)
- Testing frameworks
- Logging utilities

## Next Steps

1. Review and approve migration plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Create test infrastructure
