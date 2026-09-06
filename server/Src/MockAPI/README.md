# MockAPI

A standalone TypeScript mock API service generated from `v1.json`.

## Features

- Fastify-based mock server
- Dynamic registration of all endpoints defined in `v1.json`
- Request-body validation from the OpenAPI schema
- Random but convenient mock responses based on response schemas
- Swagger UI at `/docs`
- Replaceable provider layer for future real API integrations

## Run

```bash
npm install
npm run dev
```

The service starts on `http://localhost:3011` by default.

## Available URLs

- `GET /health`
- `GET /docs`
- `GET /docs/json`
- All `POST` endpoints defined in `v1.json`

## Environment variables

- `PORT`: server port, default `3011`
- `HOST`: bind host, default `0.0.0.0`
- `MOCK_API_BASE_URL`: server URL exposed in Swagger, default `http://localhost:<PORT>`
