# The MCP Aggregation and Integration Library

> Connect AI systems to MCPs, easily.

![Unit Tests](https://github.com/leadership-4-tech/mcp-ai/actions/workflows/ut.yml/badge.svg?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/Leadership-4-Tech/mcp-ai/badge.svg?branch=try-again)](https://coveralls.io/github/Leadership-4-Tech/mcp-ai?branch=try-again)

MCP servers are a pretty sweet idea, but having the ability to integrate them all together into a system, or package them up and make them available, should be easier. This is where this library comes in.

## Installation

```bash
npm install @l4t/mcp-ai
```

## Running Aggregator

If you install this library globally it will add the `mcp-aggregator.mts` script to be used for starting up aggregators in any context.

```bash
npm i -g @l4t/mcp-ai
```

NOTE: You must have tsx installed for it to run.

## Overview

This library is made up of two different domains.

### Integration

This library has convenient and simple tooling for integrating MCP servers into LLM workflows with tools that do the formatting for you to and from the `@modelcontextprotocol/sdk` library.

#### LLM Provider Support

Currently supports the following LLM Client's Format:

- Openai
- Anthropic
- AWS Bedrock Claude

#### A Note For Frontend Use

Make sure you use an appropriate tree shaker to remove any aggregation code, because the aggregation code is completely

### Aggregation

The aggregation tooling is used for taking many different MCP servers and putting them under one configuration roof. You can attach many different MCPs to a single system with just a configuration file.

This can be useful in scenarios where you want to package all of your MCPs into 1+ docker images, set them up with a single docker-compose.yml file, and then travel around with that docker compose file, empowering AI systems everywhere.

You can even save your configuration file with your system, making it clear what MCP's are required for your system to work. (Pretty cool huh?)

#### MCP Connections Supported

- CLI STDOUT IO
- HTTP
- SSE

### Using Them Together

`LLM Providers -> Integrator -> Aggregator -> MCP Servers`

## Configuration Examples

### Integrator Configurations

#### CLI Integrator

```json
{
  "integrator": {
    "connection": {
      "type": "cli",
      "path": "tsx",
      "args": ["./bin/cliServer.mts", "./config.json"]
    },
    "provider": "aws-bedrock-claude",
    "model": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "modelId": "arn:aws:bedrock:us-east-1:461659650211:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "maxParallelCalls": 1
  }
}
```

#### HTTP Integrator

```json
{
  "integrator": {
    "connection": {
      "type": "http",
      "url": "http://localhost:3000",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "provider": "openai",
    "model": "gpt-4-turbo-preview",
    "maxParallelCalls": 1
  }
}
```

#### SSE Integrator

```json
{
  "integrator": {
    "connection": {
      "type": "sse",
      "url": "http://localhost:3000"
    },
    "provider": "claude",
    "model": "claude-3-opus-20240229",
    "maxParallelCalls": 1
  }
}
```

### Server Configurations

#### CLI Server

```json
{
  "aggregator": {
    "server": {
      "connection": {
        "type": "cli"
      },
      "maxParallelCalls": 10
    },
    "mcps": [
      {
        "id": "filesystem",
        "connection": {
          "type": "cli",
          "path": "npx",
          "args": ["-y", "@modelcontextprotocol/server-memory"]
        }
      }
    ]
  }
}
```

#### HTTP Server

```json
{
  "aggregator": {
    "server": {
      "connection": {
        "type": "http",
        "url": "http://localhost:3000",
        "port": 3000
      },
      "path": "/",
      "maxParallelCalls": 10
    },
    "mcps": [
      {
        "id": "filesystem",
        "connection": {
          "type": "cli",
          "path": "npx",
          "args": ["-y", "@modelcontextprotocol/server-memory"]
        }
      }
    ]
  }
}
```

#### SSE Server

```json
{
  "aggregator": {
    "server": {
      "connection": {
        "type": "sse",
        "url": "http://localhost:3000",
        "port": 3000
      },
      "path": "/",
      "messagesPath": "/messages",
      "maxParallelCalls": 10
    },
    "mcps": [
      {
        "id": "filesystem",
        "connection": {
          "type": "cli",
          "path": "npx",
          "args": ["-y", "@modelcontextprotocol/server-memory"]
        }
      }
    ]
  }
}
```

### MCP Connection Variations

#### CLI MCP Connection

```json
{
  "id": "memory",
  "connection": {
    "type": "cli",
    "path": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "env": {
      "MEMORY_PATH": "./data"
    },
    "cwd": "./"
  }
}
```

#### HTTP MCP Connection

```json
{
  "id": "filesystem",
  "connection": {
    "type": "http",
    "url": "http://localhost:3001",
    "headers": {
      "Authorization": "Bearer your-token"
    },
    "timeout": 5000,
    "retry": {
      "attempts": 3,
      "backoff": 1000
    }
  }
}
```

#### SSE MCP Connection

```json
{
  "id": "streaming",
  "connection": {
    "type": "sse",
    "url": "http://localhost:3002"
  }
}
```

#### WebSocket MCP Connection

```json
{
  "id": "realtime",
  "connection": {
    "type": "ws",
    "url": "ws://localhost:3003",
    "protocols": ["mcp-v1"],
    "headers": {
      "Authorization": "Bearer your-token"
    },
    "reconnect": {
      "attempts": 5,
      "backoff": 1000
    }
  }
}
```

### Full Configuration Example

A complete configuration combining both integrator and aggregator:

```json
{
  "integrator": {
    "connection": {
      "type": "cli",
      "path": "tsx",
      "args": ["./bin/cliServer.mts", "./config.json"]
    },
    "provider": "aws-bedrock-claude",
    "model": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "modelId": "arn:aws:bedrock:us-east-1:461659650211:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "maxParallelCalls": 1
  },
  "aggregator": {
    "server": {
      "connection": {
        "type": "cli"
      },
      "maxParallelCalls": 10
    },
    "mcps": [
      {
        "id": "filesystem",
        "connection": {
          "type": "cli",
          "path": "npx",
          "args": ["-y", "@modelcontextprotocol/server-memory"]
        }
      }
    ]
  }
}
```

## Testing

There are a few examples included in the

### Environment Variables

Depending on the provider, you may need to set these environment variables for tests:

- OpenAI: `OPENAI_API_KEY`
- Claude: `ANTHROPIC_API_KEY`
- AWS Bedrock: AWS credentials configured in your environment

## Notes

- The `modelId` field is required for AWS Bedrock and should be the ARN of your model
- For HTTP and SSE servers, the `port` field is optional and defaults to 3000
- The `path` field in server configurations is optional and defaults to '/'
- For SSE servers, the `messagesPath` field is optional and defaults to '/messages'
- `maxParallelCalls` is optional and defaults to 1 for integrators and 10 for servers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

GPL v3
