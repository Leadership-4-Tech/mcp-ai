#!/usr/bin/env node

import express from 'express'
import cors from 'cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js'
import { randomUUID } from 'crypto'
import { create as createFeatures } from '../features/index.js'
import { McpAggregatorConfig } from '../../common/types.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

const create = async (config: McpAggregatorConfig) => {
  const features = await createFeatures(config)
  await features.initialize()
  const tools = await features.getTools()

  const app = express()
  app.use(express.json())
  app.use(cors())

  const setupServer = async (port: number=3000) => {
    app.listen(port)
  }

 
  const tools2 = tools.map(tool => ({
          name: tool.name,
          description: tool.description || "",
          parameters: tool.inputSchema
        }))
        console.log('Tools2', JSON.stringify(tools2, null, 2))

    const server = new McpServer({
      name: 'mcp-aggregator',
      version: '1.0.0',
      capabilities: {
        tools: tools2,
      },
    })
    tools.forEach(tool => {
      console.log(tool)
      server.tool(tool.name, tool.description || "", tool.inputSchema, async (extra) => {
        console.log('Received tool call:', tool.name, extra)
        // Extract parameters from the request
        const results = await features.executeTool(tool.name, extra)
        console.log('Results:', results)
        return results as any
      })
    })

      // Store transports by session ID
  const transports = {};
  
  // SSE endpoint for establishing the stream
  app.get('/mcp', async (req, res) => {
    console.log('Received GET request to /sse (establishing SSE stream)');
  
    try {
      // Create a new SSE transport for the client
      // The endpoint for POST messages is '/messages'
      const transport = new SSEServerTransport('/messages', res);
  
      // Store the transport by session ID
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;
  
      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        console.log(`SSE transport closed for session ${sessionId}`);
        delete transports[sessionId];
      };
  
      // Connect the transport to the MCP server
      await server.connect(transport);
  
      // Start the SSE transport to begin streaming
      // This sends an initial 'endpoint' event with the session ID in the URL
      //await transport.start();
  
      console.log(`Established SSE stream with session ID: ${sessionId}`);
    } catch (error) {
      console.error('Error establishing SSE stream:', error);
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE stream');
      }
    }
  });
  
  // Messages endpoint for receiving client JSON-RPC requests
  app.post('/messages', async (req, res) => {
    console.log('Received POST request to /messages');
  
    // Extract session ID from URL query parameter
    // In the SSE protocol, this is added by the client based on the endpoint event
    const sessionId = req.query.sessionId;
  
    if (!sessionId) {
      console.error('No session ID provided in request URL');
      res.status(400).send('Missing sessionId parameter');
      return;
    }
  
    const transport = transports[sessionId];
    if (!transport) {
      console.error(`No active transport found for session ID: ${sessionId}`);
      res.status(404).send('Session not found');
      return;
    }
  
    try {
      // Handle the POST message with the transport
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error('Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).send('Error handling request');
      }
    }
  });

  const stop = async () => {
    Object.values(transports).forEach(transport => {
      // @ts-ignore
      transport.close()
    })
  }

  return {
    start: setupServer,
    stop,
  }
}

export {
  create,
}