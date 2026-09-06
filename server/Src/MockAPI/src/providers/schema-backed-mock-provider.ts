import type { MockOperationContext, MockOperationProvider } from './mock-operation-provider.js';
import { SchemaMockGenerator } from '../mocks/schema-mock-generator.js';

export class SchemaBackedMockProvider implements MockOperationProvider {
  constructor(private readonly generator: SchemaMockGenerator) {}

  async generate(context: MockOperationContext): Promise<unknown> {
    const payload = this.generator.generate(context.operation.responseSchema);

    return payload;
  }
}
