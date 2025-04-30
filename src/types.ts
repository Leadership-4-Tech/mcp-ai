export enum Provider {
  Claude = 'claude',
  OpenAI = 'openai',
  Bedrock = 'bedrock'
}

export type JsonAble = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: JsonAble } 
  | readonly JsonAble[];

export type Tool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * The format of the configuration.
 * @interface
 */
export type McpIntegrationConfig = {
  /**
   * The maximum number of tool calls that will be called in parallel.
   */
  maxParallelCalls?: number,
  tools: readonly Tool[]
}

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, JsonAble>;
}

export type ToolResponse = {
  tool_call_id: string;  // Unique ID linking to the original tool call
  tool_name: string;     // Name of the tool that was executed
  status: 'success' | 'error';
  output: JsonAble;      // The actual result of the tool execution
  error?: string;        // Optional error message if status is 'error'
}

export type ClaudeToolFormat = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export type OpenAIToolFormat = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type BedrockToolFormat = {
  toolSpec: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }
}


export type McpIntegration<P extends Provider> = {
  getTools: () => P extends Provider.Claude
      ? readonly ClaudeToolFormat[]
      : P extends Provider.OpenAI
      ? readonly OpenAIToolFormat[]
      : readonly BedrockToolFormat[]
  getToolCalls: (providerResponse: any) => readonly ToolCall[]
  executeToolCalls: (toolCalls: readonly ToolCall[]) => Promise<readonly ToolResponse[]>
  formulateResponse: (originalResponse: any, toolResponses: ToolResponse[]) => any 
}
