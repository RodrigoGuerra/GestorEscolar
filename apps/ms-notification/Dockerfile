# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy ALL workspace manifests before install so the lockfile resolves correctly
COPY package*.json ./
COPY apps/ms-identity/package*.json ./apps/ms-identity/
COPY apps/ms-academic/package*.json ./apps/ms-academic/
COPY apps/ms-hr/package*.json ./apps/ms-hr/
COPY apps/ms-finance/package*.json ./apps/ms-finance/
COPY apps/ms-notification/package*.json ./apps/ms-notification/
COPY apps/frontend/package*.json ./apps/frontend/

# Full root install — hoists all workspace deps to /app/node_modules
RUN npm install

COPY apps/ms-notification/ ./apps/ms-notification/

WORKDIR /app/apps/ms-notification
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/ms-notification/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/ms-notification/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3005
CMD ["node", "dist/main"]
