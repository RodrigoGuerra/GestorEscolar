# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all workspace manifests so npm can resolve the full lock file
COPY package*.json ./
COPY apps/ms-identity/package*.json ./apps/ms-identity/
COPY apps/ms-academic/package*.json ./apps/ms-academic/
COPY apps/ms-hr/package*.json ./apps/ms-hr/
COPY apps/ms-finance/package*.json ./apps/ms-finance/
COPY apps/ms-notification/package*.json ./apps/ms-notification/

RUN npm install --workspace=apps/ms-hr

COPY apps/ms-hr/ ./apps/ms-hr/

WORKDIR /app/apps/ms-hr
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/ms-hr/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/ms-hr/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3003
CMD ["node", "dist/main"]
