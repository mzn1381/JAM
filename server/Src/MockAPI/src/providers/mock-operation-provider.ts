import type { FastifyRequest } from 'fastify';
import type { RegisteredOperation } from '../types/openapi.js';

export interface MockOperationContext {
  operation: RegisteredOperation;
  request: FastifyRequest;
}

export interface MockOperationProvider {
  generate(context: MockOperationContext): Promise<unknown>;
}
