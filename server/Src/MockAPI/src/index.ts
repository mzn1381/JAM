import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { loadOpenApiBundle } from './config/openapi.js';
import { SchemaMockGenerator } from './mocks/schema-mock-generator.js';
import { SchemaBackedMockProvider } from './providers/schema-backed-mock-provider.js';
import { registerMockRoutes } from './routes/register-mock-routes.js';

const port = Number(process.env.PORT ?? 3011);
const host = process.env.HOST ?? '0.0.0.0';
const publicBaseUrl = process.env.MOCK_API_BASE_URL ?? `http://localhost:${port}`;

async function buildServer() {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        allowUnionTypes: true,
        strict: false,
      },
    },
  });

  const { rawDocument, operations } = await loadOpenApiBundle(publicBaseUrl);

  await app.register(cors, {
    origin: true,
  });

  await app.register(swagger, {
    mode: 'static',
    specification: {
      document: rawDocument as never,
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'MockAPI',
    operations: operations.length,
  }));

  const provider = new SchemaBackedMockProvider(new SchemaMockGenerator());
  await registerMockRoutes(app, operations, provider);

  return app;
}

async function start() {
  const app = await buildServer();
  await app.listen({ host, port });
  app.log.info(`MockAPI is running at ${publicBaseUrl}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
