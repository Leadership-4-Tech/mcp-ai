# Chat Test

This test demonstrates how to use the MCP Integrator as an interactive AI chat agent. It provides a simple command-line interface for chatting with various AI providers.

## Configuration

The test requires a configuration file (`config.json`) that specifies the integrator settings:

- `provider`: The AI provider to use (e.g., "aws-bedrock-claude", "openai", "claude")
- `model`: The model identifier
- `modelId`: Required for AWS Bedrock (the ARN of the model)
- `connection`: CLI connection details

### Required Environment Variables

Depending on the provider, you'll need to set these environment variables:

- OpenAI: `OPENAI_API_KEY`
- Claude: `ANTHROPIC_API_KEY`
- AWS Bedrock: AWS credentials configured in your environment

## Usage

1. Copy the example `config.json` file
2. Update the configuration values for your environment:
   - For AWS Bedrock: Update the `modelId` with your model ARN
   - For other providers: Update the model and connection details
3. Set the required environment variables
4. Run the chat:
   ```bash
   tsx ./bin/chat.mts ./path/to/your/config.json
   ```

## Features

- Interactive command-line chat interface
- Support for multiple AI providers:
  - OpenAI
  - Claude
  - AWS Bedrock Claude
- Type "exit" or "quit" to end the conversation
- Automatic cleanup of resources when done

## Example Usage

```bash
# Start the chat with your configuration
tsx ./bin/chat.mts ./config.json

# You'll see:
Chat started. Type "exit" or "quit" to end the conversation.
----------------------------------------
You: Hello, how are you?
Assistant: I'm doing well, thank you for asking! How can I assist you today?
```

## Notes

- The chat interface is simple but can be extended for more complex interactions
- Make sure your credentials and model IDs are properly configured
- The test demonstrates how to integrate the MCP Integrator into a chat application
- Each provider may have different capabilities and response formats
