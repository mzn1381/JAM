export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
}

export interface PathItem {
  post?: OperationObject;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: SchemaObject }>;
  };
  responses?: Record<string, { content?: Record<string, { schema?: SchemaObject }> }>;
  security?: Array<Record<string, string[]>>;
}

export type SchemaObject = Record<string, unknown>;

export interface RegisteredOperation {
  method: 'POST';
  path: string;
  requestSchema?: SchemaObject;
  responseSchema?: SchemaObject;
  operation: OperationObject;
}
