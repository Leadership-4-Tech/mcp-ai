# MCP Integrator Design

## Overview

The MCP (Model Context Protocol) Integrator is a system designed to facilitate communication between LLM providers (Claude, OpenAI, AWS Bedrock Claude) and MCP-compatible tools. It consists of two main components:

1. **Integrator**: Handles direct communication with a single MCP server, translating between provider-specific formats and MCP.
2. **Aggregator**: Manages multiple MCP connections and routes tool calls to the appropriate MCP server.

## Architecture

### Integrator (`src/integrator/`)

The integrator is responsible for:

- Establishing a connection to an MCP server
- Converting provider-specific tool formats to/from MCP format
- Handling tool execution and response formatting

Key components:

- `features/`: High-level interface for provider interactions
  - Tool retrieval and formatting
  - Tool call extraction from provider responses
  - Tool execution and result combination
- `services/`: Core MCP communication logic
  - Connection management
  - Provider-specific format conversions
  - Tool execution handling

Provider-specific formatting:

- **Claude**: Uses `tool_calls` and `tool_results` format
- **OpenAI**: Uses function calling format with `name`, `description`, and `parameters`
- **AWS Bedrock Claude**: Similar to Claude's format

### Aggregator (`src/aggregator/`)

The aggregator manages:

- Multiple MCP connections identified by unique IDs
- Tool discovery across all connected MCPs
- Tool call routing to appropriate MCP servers

Key components:

- `features/`: High-level interface for multi-MCP management
  - Connection initialization and cleanup
  - Tool aggregation across MCPs
  - Tool call routing
- `services/`: Connection management for different transport types
  - HTTP/WebSocket/CLI/Docker transport support
  - Connection pooling and lifecycle management

## Data Flow

1. **Tool Discovery**:

   ```
   Provider -> Integrator -> MCP Server
                ↓
           Format tools for provider
   ```

2. **Tool Execution**:

   ```
   Provider Response -> Integrator -> Extract tool calls
                          ↓
                    Execute via MCP
                          ↓
                    Format results
                          ↓
                    Return to Provider
   ```

3. **Aggregator Routing**:
   ```
   Tool Call -> Aggregator -> Find MCP by ID
                   ↓
               Route to Integrator
                   ↓
               Return Results
   ```

## Connection Types

The system supports multiple connection types:

- **HTTP**: RESTful API communication
- **WebSocket**: Real-time bidirectional communication
- **CLI**: Command-line tool integration
- **Docker**: Container-based tool execution
  - Container-per-request: New container for each call
  - Persistent-container: Reuse container for multiple calls

## Type System

Core types:

- `McpIntegratorConfig`: Configuration for single MCP connection
- `McpAggregatorConfig`: Configuration for multiple MCP connections
- `Connection`: Union type of all supported connection methods
- `ToolFormat`: Provider-specific tool format
- `ToolCall`: Standardized tool call format
- `ToolResult`: Tool execution result format

## Error Handling

- Connection failures are propagated with detailed error messages
- Tool execution errors include both MCP and provider-specific details
- Transport-specific error handling for each connection type
- Automatic reconnection support for WebSocket connections

## Future Considerations

1. **Streaming Support**:

   - Real-time tool execution updates
   - Streaming responses from tools

2. **Additional Providers**:

   - Support for more LLM providers
   - Custom provider format handlers

3. **Enhanced Routing**:
   - Load balancing across MCPs
   - Tool capability-based routing
   - Failover support
