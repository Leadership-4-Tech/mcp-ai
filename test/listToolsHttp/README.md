# List Tools Using HTTP Test

This test demonstrates the integration between the MCP Integrator and Aggregator by listing available tools but doing it over an HTTP connection. It uses both components to show how they work together in a real-world scenario.

## Configuration

The test requires a configuration file (`config.json`) that specifies:

- Integrator settings (provider, model, connection details)
- Aggregator settings (server and MCP configurations)

You'll need to update the example so that it works for your situation.

### Required Configuration Fields

For the integrator:

- `provider`: The AI provider to use (e.g., "aws-bedrock-claude")
- `model`: The model identifier
- `modelId`: Required for AWS Bedrock (the ARN of the model)
- `connection`: CLI connection details

For the aggregator:

- `server`: Server configuration
- `mcps`: Array of MCP configurations

## Usage

1. Copy the example `config.json` file
2. Update the configuration values for your environment:
   - For AWS Bedrock: Update the `modelId` with your model ARN
   - For other providers: Update the model and connection details
3. Run the test:
   ```bash
   tsx ./bin/listTools.mts ./path/to/your/config.json
   ```

## Example Output

The test will:

1. Initialize the integrator and aggregator
2. Connect to the specified AI provider
3. Request a list of available tools
4. Print the response to the console

## Notes

- The test uses both the integrator and aggregator to demonstrate their interaction
- Make sure your credentials and model IDs are properly configured
- The test is designed to be simple but extensible for more complex scenarios
