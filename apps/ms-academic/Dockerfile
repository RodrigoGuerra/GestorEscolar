# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/ms-academic/package*.json ./apps/ms-academic/

RUN npm install --workspace=apps/ms-academic

COPY apps/ms-academic/ ./apps/ms-academic/

WORKDIR /app/apps/ms-academic
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/ms-academic/dist ./dist
COPY --from=builder /app/apps/ms-academic/node_modules ./node_modules
COPY --from=builder /app/apps/ms-academic/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3002
CMD ["node", "dist/main"]
