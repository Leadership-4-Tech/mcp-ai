# Integration Services Update Plan

## Overview
This document outlines the necessary changes to update the integration services to match the new interfaces and improve type safety. All LLM provider implementations are part of the integrator.

## Key Changes Required

### 1. Move OpenAPI Schema to `common/types.ts`
- Move `OpenAPISchema` type to `common/types.ts` since it's a shared format used by all providers
- Keep provider-specific tool formats in `integrator/types.ts`

### 2. Update `integrator/types.ts`
- Fix the TODO regarding `tool_use_id` vs `tool_call_id` in `ToolMessage`
- Ensure all provider-specific types are properly defined
- Update type definitions to match the new interfaces

### 3. Update `integrator/services.ts`
- Rename `IntegratorService` to `LLMIntegrationService`
- Update `getTools()` to return `McpTool[]` instead of provider-specific formats
- Update `formatToolsForProvider` to take `McpTool[]` and return provider-specific formats
- Rename `combineProviderResponseWithResults` to `createToolResponseRequest`
- Update `extractCallsFromProviderResponse` to handle provider-specific response formats
- Ensure proper typing for all provider-specific implementations

### 4. Update `integrator/features.ts`
- Update to use the new `LLMIntegrationService` interface
- Ensure proper typing for all provider-specific implementations
- Update method names to match new interface

## Implementation Guidelines

### Functional Programming Principles
- Use `const` for all variable declarations
- Avoid `let` and `var` declarations
- Use `map`, `reduce`, and other functional methods instead of loops
- Keep functions pure where possible
- Use immutable data structures
- Compose functions instead of using imperative control flow

### Provider-Specific Implementation Details

#### OpenAI Implementation
- **DO NOT MODIFY** the existing OpenAI implementation
- It has been battle-tested and is working correctly
- Any changes should be made through the type system only

#### Claude Implementation
- Update to use functional approach
- Handle `tool_use_id` instead of `tool_call_id`
- Ensure proper message format conversion
- Use immutable data structures

#### AWS Bedrock Claude Implementation
- Update to use functional approach
- Handle `tool_use_id` instead of `tool_call_id`
- Ensure proper message format conversion
- Use immutable data structures

## Migration Steps

1. Move `OpenAPISchema` to `common/types.ts`
2. Update `integrator/types.ts` with new interfaces
3. Update `integrator/services.ts` implementations
4. Update `integrator/features.ts` to use new interfaces
5. Update all references in the codebase
6. Add proper JSDoc comments for all interfaces and methods

## Testing Plan

1. Update test files to use new interfaces
2. Test each provider implementation separately
3. Test tool message format handling
4. Test tool format conversion
5. Test response handling and request creation

## Notes
- Ensure backward compatibility during migration
- Add proper error handling for type mismatches
- Consider adding validation for tool formats
- Document any breaking changes
- Maintain functional programming principles throughout
- Preserve the working OpenAI implementation
- Focus improvements on Claude and Bedrock implementations 