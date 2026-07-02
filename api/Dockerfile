
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# ---- production ----
FROM node:24-alpine AS production

LABEL maintainer="PetaFlops-web"
LABEL description="Open-Job - Job Portal REST API"
LABEL version="1.0.0"

RUN apk add --no-cache dumb-init curl tini

RUN addgroup -g 1001 -S nodejs && \
    adduser -S openjob -u 1001 -G nodejs

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Application code
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./


# Runtime assets: locales for i18next-fs-backend, migrations for on-startup migration runner
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Optional: include .env.example as reference for env vars
COPY --from=builder /app/.env.example ./

# Ensure PDF document storage directory exists (matches src/documents/storage/config-storage.js)
RUN mkdir -p /app/src/documents/pdf /app/src/profile/uploads /app/src/companies/uploads /app/logs && \
    chmod +x /app/docker-entrypoint.sh && \
    chown -R openjob:nodejs /app

USER openjob

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "server.js"]
