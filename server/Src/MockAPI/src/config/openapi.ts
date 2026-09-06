import path from "node:path";
import { fileURLToPath } from "node:url";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import type { OpenApiDocument, RegisteredOperation, SchemaObject } from "../types/openapi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const specPath = path.join(projectRoot, "v1.json");

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getJsonContentSchema(source?: Record<string, { schema?: SchemaObject }>): SchemaObject | undefined {
  return source?.["application/json"]?.schema ?? source?.["text/json"]?.schema ?? source?.["text/plain"]?.schema;
}

export async function loadOpenApiBundle(baseUrl: string): Promise<{
  rawDocument: OpenApiDocument;
  dereferencedDocument: OpenApiDocument;
  operations: RegisteredOperation[];
}> {
  const raw = clone(
    JSON.parse(await import("node:fs/promises").then((fs) => fs.readFile(specPath, "utf8"))) as OpenApiDocument,
  );
  raw.servers = [{ url: baseUrl, description: "Local MockAPI server" }];

  const dereferenced = (await $RefParser.dereference(clone(raw))) as OpenApiDocument;
  const operations: RegisteredOperation[] = [];

  for (const [routePath, pathItem] of Object.entries(dereferenced.paths)) {
    const operation = pathItem.post;
    if (!operation) {
      continue;
    }

    operations.push({
      method: "POST",
      path: routePath,
      requestSchema: getJsonContentSchema(operation.requestBody?.content),
      responseSchema: getJsonContentSchema(operation.responses?.["200"]?.content),
      operation,
    });
  }

  return {
    rawDocument: raw,
    dereferencedDocument: dereferenced,
    operations,
  };
}
