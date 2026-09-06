FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/99-generate-runtime-config.sh /docker-entrypoint.d/99-generate-runtime-config.sh
COPY --from=builder /app/dist-web /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/99-generate-runtime-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
