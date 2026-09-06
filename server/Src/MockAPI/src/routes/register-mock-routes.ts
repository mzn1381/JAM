import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { MockOperationProvider } from "../providers/mock-operation-provider.js";
import type { RegisteredOperation } from "../types/openapi.js";

function hasBearerSecurity(operation: RegisteredOperation): boolean {
  return (
    Array.isArray(operation.operation.security) &&
    operation.operation.security.some((requirement) => Object.prototype.hasOwnProperty.call(requirement, "Bearer"))
  );
}

function getBearerToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

async function ensureSecurity(
  operation: RegisteredOperation,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  if (!hasBearerSecurity(operation)) {
    return true;
  }

  if (getBearerToken(request)) {
    return true;
  }

  await reply.code(401).send({
    success: false,
    code: 401,
    error: "Unauthorized",
    message: "A Bearer token is required for this mock endpoint.",
    data: null,
  });

  return false;
}

export async function registerMockRoutes(
  app: FastifyInstance,
  operations: RegisteredOperation[],
  provider: MockOperationProvider,
): Promise<void> {
  for (const operation of operations) {
    app.route({
      method: operation.method,
      url: operation.path,
      schema: operation.requestSchema
        ? {
            body: operation.requestSchema,
            response: operation.responseSchema ? { 200: operation.responseSchema } : undefined,
          }
        : undefined,
      handler: async (request, reply) => {
        const authorized = await ensureSecurity(operation, request, reply);
        if (!authorized) {
          return;
        }

        const payload = await provider.generate({ operation, request });
        await reply.code(200).send(payload);
      },
    });
  }
}
