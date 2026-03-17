# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/ms-finance/package*.json ./apps/ms-finance/

RUN npm install --workspace=apps/ms-finance

COPY apps/ms-finance/ ./apps/ms-finance/

WORKDIR /app/apps/ms-finance
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/ms-finance/dist ./dist
COPY --from=builder /app/apps/ms-finance/node_modules ./node_modules
COPY --from=builder /app/apps/ms-finance/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3004
CMD ["node", "dist/main"]
