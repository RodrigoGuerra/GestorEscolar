# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files for workspace resolution
COPY package*.json ./
COPY apps/ms-identity/package*.json ./apps/ms-identity/

# Install only production deps + devDeps needed for build
RUN npm install --workspace=apps/ms-identity

# Copy source
COPY apps/ms-identity/ ./apps/ms-identity/

WORKDIR /app/apps/ms-identity
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only production node_modules and compiled output
COPY --from=builder /app/apps/ms-identity/dist ./dist
COPY --from=builder /app/apps/ms-identity/node_modules ./node_modules
COPY --from=builder /app/apps/ms-identity/package.json ./package.json

# F15: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
CMD ["node", "dist/main"]
