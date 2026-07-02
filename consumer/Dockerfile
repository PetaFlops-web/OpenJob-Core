FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S consumer -u 1001 -G nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY . .

RUN chown -R consumer:nodejs /app
USER consumer

CMD ["node", "index.js"]
