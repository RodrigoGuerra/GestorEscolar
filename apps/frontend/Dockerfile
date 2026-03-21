# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy ALL workspace manifests
COPY package*.json ./
COPY apps/ms-identity/package*.json ./apps/ms-identity/
COPY apps/ms-academic/package*.json ./apps/ms-academic/
COPY apps/ms-hr/package*.json ./apps/ms-hr/
COPY apps/ms-finance/package*.json ./apps/ms-finance/
COPY apps/ms-notification/package*.json ./apps/ms-notification/
COPY apps/frontend/package*.json ./apps/frontend/

# Full root install
RUN npm install

COPY apps/frontend/ ./apps/frontend/

WORKDIR /app/apps/frontend
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy the build output from the builder stage to the nginx html directory
COPY --from=builder /app/apps/frontend/dist .

# Add a simple nginx config if needed, but for now the default should work for a basic React app
# If using client-side routing, we might need a custom nginx config to redirect all requests to index.html
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
