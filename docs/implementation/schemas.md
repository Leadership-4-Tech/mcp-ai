# LLM API Schemas: Claude, AWS Bedrock Claude, and OpenAI

This document provides a comprehensive comparison of the request and response schemas for:

1. Claude API (Direct)
2. Claude on AWS Bedrock
3. OpenAI API

## 1. CLAUDE API (DIRECT)

### Request Schema

```json
{
  "model": "claude-3-5-sonnet-20240620",
  "max_tokens": 1024,
  "system": "You are a helpful assistant that specializes in weather information.",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Seattle today?"
    }
  ],
  "tools": [
    {
      "name": "weather_tool",
      "description": "Get current weather information for a location",
      "input_schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state/country for which to get weather information"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "The temperature unit to use"
          }
        },
        "required": ["location"]
      }
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9
}
```

### Response Schema (Tool Call)

```json
{
  "id": "msg_01AbCdEfGhIjKlMnOpQrStUv",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20240620",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01AbCdEfGhIjKlMnOpQrStUv",
      "name": "weather_tool",
      "input": {
        "location": "Seattle, WA",
        "unit": "fahrenheit"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 156,
    "output_tokens": 42
  }
}
```

### Tool Result Request Schema

```json
{
  "model": "claude-3-5-sonnet-20240620",
  "max_tokens": 1024,
  "system": "You are a helpful assistant that specializes in weather information.",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Seattle today?"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_01AbCdEfGhIjKlMnOpQrStUv",
          "name": "weather_tool",
          "input": {
            "location": "Seattle, WA",
            "unit": "fahrenheit"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01AbCdEfGhIjKlMnOpQrStUv",
          "content": "{\"location\":\"Seattle, WA\",\"temperature\":\"52°F\",\"condition\":\"Rainy\",\"humidity\":\"85%\"}"
        }
      ]
    }
  ],
  "tools": [
    {
      "name": "weather_tool",
      "description": "Get current weather information for a location",
      "input_schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state/country for which to get weather information"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "The temperature unit to use"
          }
        },
        "required": ["location"]
      }
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9
}
```

### Final Response Schema

```json
{
  "id": "msg_02BcDeFgHiJkLmNoPqRsTuVw",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20240620",
  "content": [
    {
      "type": "text",
      "text": "The weather in Seattle today is rainy with a temperature of 52°F and humidity at 85%. It's a typical Seattle day - you might want to bring an umbrella if you're heading out!"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 234,
    "output_tokens": 68
  }
}
```

## 2. CLAUDE ON AWS BEDROCK

### Request Schema

```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 1024,
  "system": "You are a helpful assistant that specializes in weather information.",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What's the weather like in Seattle today?"
        }
      ]
    }
  ],
  "tools": [
    {
      "type": "custom",
      "name": "weather_tool",
      "description": "Get current weather information for a location",
      "input_schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state/country for which to get weather information"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "The temperature unit to use"
          }
        },
        "required": ["location"]
      }
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9
}
```

### Response Schema (Tool Call)

```json
{
  "id": "msg_bdrk_01AbCdEfGhIjKlMnOpQrStUv",
  "type": "message",
  "role": "assistant",
  "model": "anthropic.claude-3-sonnet-20240229",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01AbCdEfGhIjKlMnOpQrStUv",
      "name": "weather_tool",
      "input": {
        "location": "Seattle, WA",
        "unit": "fahrenheit"
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 156,
    "output_tokens": 42
  }
}
```

### Tool Result Request Schema

```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 1024,
  "system": "You are a helpful assistant that specializes in weather information.",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What's the weather like in Seattle today?"
        }
      ]
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_01AbCdEfGhIjKlMnOpQrStUv",
          "name": "weather_tool",
          "input": {
            "location": "Seattle, WA",
            "unit": "fahrenheit"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01AbCdEfGhIjKlMnOpQrStUv",
          "content": "{\"location\":\"Seattle, WA\",\"temperature\":\"52°F\",\"condition\":\"Rainy\",\"humidity\":\"85%\"}"
        }
      ]
    }
  ],
  "tools": [
    {
      "type": "custom",
      "name": "weather_tool",
      "description": "Get current weather information for a location",
      "input_schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state/country for which to get weather information"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "The temperature unit to use"
          }
        },
        "required": ["location"]
      }
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9
}
```

### Final Response Schema

```json
{
  "id": "msg_bdrk_02BcDeFgHiJkLmNoPqRsTuVw",
  "type": "message",
  "role": "assistant",
  "model": "anthropic.claude-3-sonnet-20240229",
  "content": [
    {
      "type": "text",
      "text": "The weather in Seattle today is rainy with a temperature of 52°F and humidity at 85%. It's a typical Seattle day - you might want to bring an umbrella if you're heading out!"
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 234,
    "output_tokens": the message.
  }
}
```

## 3. OPENAI API

### Request Schema

```json
{
  "model": "gpt-4o-2024-08-06",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that specializes in weather information."
    },
    {
      "role": "user",
      "content": "What's the weather like in Seattle today?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather information for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state/country for which to get weather information"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "The temperature unit to use"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto",
  "temperature": 0.7,
  "max_tokens": 1024
}
```

### Response Schema (Tool Call)

```json
{
  "id": "chatcmpl-abc123def456",
  "object": "chat.completion",
  "created": 1715000000,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123def456",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\":\"Seattle, WA\",\"unit\":\"fahrenheit\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 156,
    "completion_tokens": 42,
    "total_tokens": 198
  }
}
```

### Tool Result Request Schema

```json
{
  "model": "gpt-4o-2024-08-06",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that specializes in weather information."
    },
    {
      "role": "user",
      "content": "What's the weather like in Seattle today?"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_abc123def456",
          "type": "function",
          "function": {
            "name": "get_weather",
            "arguments": "{\"location\":\"Seattle, WA\",\"unit\":\"fahrenheit\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc123def456",
      "content": "{\"location\":\"Seattle, WA\",\"temperature\":\"52°F\",\"condition\":\"Rainy\",\"humidity\":\"85%\"}"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather information for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state/country for which to get weather information"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "The temperature unit to use"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}
```

### Final Response Schema

```json
{
  "id": "chatcmpl-xyz789abc456",
  "object": "chat.completion",
  "created": 1715000050,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The weather in Seattle today is rainy with a temperature of 52°F and humidity at 85%. It's a typical Seattle day - you might want to bring an umbrella if you're heading out!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 234,
    "completion_tokens": 68,
    "total_tokens": 302
  }
}
```

### OpenAI Structured Output Request

```json
{
  "model": "gpt-4o-2024-08-06",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that provides information in a structured format."
    },
    {
      "role": "user",
      "content": "Give me weather information for Seattle."
    }
  ],
  "response_format": {
    "type": "json_object",
    "schema": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string"
        },
        "current_weather": {
          "type": "object",
          "properties": {
            "temperature": {
              "type": "number"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"]
            },
            "condition": {
              "type": "string"
            },
            "humidity": {
              "type": "number"
            }
          },
          "required": ["temperature", "unit", "condition"]
        }
      },
      "required": ["location", "current_weather"]
    }
  },
  "temperature": 0.7,
  "max_tokens": 1024
}
```

### OpenAI Structured Output Response

```json
{
  "id": "chatcmpl-def789xyz456",
  "object": "chat.completion",
  "created": 1715000100,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"location\":\"Seattle, WA\",\"current_weather\":{\"temperature\":52,\"unit\":\"fahrenheit\",\"condition\":\"Rainy\",\"humidity\":85}}",
        "parsed": {
          "location": "Seattle, WA",
          "current_weather": {
            "temperature": 52,
            "unit": "fahrenheit",
            "condition": "Rainy",
            "humidity": 85
          }
        }
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 167,
    "completion_tokens": 36,
    "total_tokens": 203
  }
}
```

## KEY DIFFERENCES

### Claude vs. OpenAI

1. **Request Structure**:

   - Claude uses a unified `tools` array with an `input_schema` for each tool
   - OpenAI uses `tools` with nested `function` objects containing `parameters`
   - Claude (direct) has `content` that can be a string or array of content blocks
   - OpenAI has the `role` field at the message level, not the content level

2. **Response Structure**:

   - Claude returns tool calls as `content` with `type: "tool_use"`
   - OpenAI returns tool calls in the `tool_calls` array
   - Claude uses `stop_reason: "tool_use"` to indicate a tool call
   - OpenAI uses `finish_reason: "tool_calls"` to indicate a tool call

3. **Tool Results**:

   - Claude takes tool results as `type: "tool_result"` in a user message's content array
   - OpenAI takes tool results with a distinct `"role": "tool"` message type

4. **Structured Output**:
   - Claude does not have a separate schema for structured outputs
   - OpenAI has a distinct `response_format` parameter with a JSON schema

### Claude Direct vs. Claude on AWS Bedrock

1. **Request Structure**:

   - Bedrock requires `anthropic_version: "bedrock-2023-05-31"`
   - Bedrock requires `type: "custom"` in tool definitions
   - Direct Claude doesn't need these extra fields

2. **Response Structure**:
   - Bedrock responses include a `stop_sequence` field (usually null)
   - Bedrock message IDs have a `msg_bdrk_` prefix
   - Direct Claude message IDs have no special prefix
