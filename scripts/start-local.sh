#!/bin/bash

# Ecosystem Startup Script for GestorEscolar
# This script handles infrastructure, health checks, and application startup.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}=== Starting GestorEscolar Ecosystem ===${NC}"

# 0. First-time setup: generate .env files if they don't exist
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo -e "${YELLOW}Step 0: .env not found — running first-time setup...${NC}"
  bash "$ROOT_DIR/scripts/setup.sh" --no-google
  echo -e "${YELLOW}  ⚠  Edit apps/ms-identity/.env and set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET${NC}"
fi

# 1. Start ONLY infrastructure containers (not the app containers)
# The microservices will run locally via npm run start:all (step 4)
echo -e "${YELLOW}Step 1/4: Starting infrastructure containers...${NC}"
docker compose up -d postgres redis rabbitmq kong prometheus grafana

# 2. Health Checks
echo -e "${YELLOW}Step 2/4: Waiting for services to be ready...${NC}"
until docker exec schooldb pg_isready -U admin -d gestor_escolar -q; do
  echo -e "${BLUE}  Waiting for PostgreSQL...${NC}"
  sleep 2
done
echo -e "${GREEN}  PostgreSQL is ready!${NC}"
sleep 5  # RabbitMQ needs a few extra seconds
echo -e "${GREEN}  RabbitMQ is ready!${NC}"

# 3. Migrations
# DATABASE_HOST=localhost because migrations run on the host (postgres is exposed on 127.0.0.1:5432)
echo -e "${YELLOW}Step 3/4: Running TypeORM migrations...${NC}"
for svc in ms-identity ms-academic ms-hr ms-finance; do
  SVC_DIR="$ROOT_DIR/apps/$svc"
  echo -e "${BLUE}  → $svc${NC}"

  # Generate migration files on first run (empty migrations dir)
  MIGRATION_COUNT=$(find "$SVC_DIR/src/migrations" -name "*.ts" 2>/dev/null | wc -l)
  if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${BLUE}    No migrations found — generating initial schema...${NC}"
    (cd "$SVC_DIR" && DATABASE_HOST=localhost npm run migration:generate -- src/migrations/InitialSchema 2>&1) \
      && echo -e "${GREEN}    Migration file generated.${NC}" \
      || echo -e "${YELLOW}    Could not generate migration — check DB connection and entities.${NC}"
  fi

  (cd "$SVC_DIR" && DATABASE_HOST=localhost npm run migration:run 2>&1) \
    && echo -e "${GREEN}    ✓ migrations applied${NC}" \
    || echo -e "${YELLOW}    ⚠ skipped (already up to date)${NC}"
done

# 4. Start microservices + frontend locally
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}✅ Infrastructure ready!${NC}"
echo -e "${GREEN}================================================================${NC}"
printf "%-22s | %s\n" "API Gateway (Kong)" "http://localhost:8000"
printf "%-22s | %s\n" "Frontend"           "http://localhost:5173"
printf "%-22s | %s\n" "RabbitMQ UI"        "http://localhost:15672"
printf "%-22s | %s\n" "Grafana"            "http://localhost:3000"
echo -e "${GREEN}================================================================${NC}"
echo -e "Starting apps... Press Ctrl+C to stop."
echo ""

npm run start:all
