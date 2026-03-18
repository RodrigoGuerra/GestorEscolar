#!/bin/bash

# Ecosystem Startup Script for GestorEscolar
# Runs everything in Docker so Kong can reach microservices by container name.
# Migrations run via docker exec after services are healthy.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}=== Starting GestorEscolar ===${NC}"

# 0. First-time setup: generate .env files if they don't exist
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo -e "${YELLOW}Step 0: .env not found — running first-time setup...${NC}"
  bash "$ROOT_DIR/scripts/setup.sh" --no-google
  echo -e "${YELLOW}  ⚠  Edit apps/ms-identity/.env and set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET${NC}"
fi

# 1. Generate infra/kong/kong.yml from template (substitutes KONG_JWT_SECRET and FRONTEND_URL)
echo -e "${YELLOW}Step 1/4: Generating Kong config from template...${NC}"
KONG_JWT_SECRET=$(grep "^KONG_JWT_SECRET=" "$ROOT_DIR/.env" | cut -d'=' -f2-)
FRONTEND_URL_VAL=$(grep "^FRONTEND_URL=" "$ROOT_DIR/.env" | cut -d'=' -f2-)
sed \
  -e "s|\${KONG_JWT_SECRET}|${KONG_JWT_SECRET}|g" \
  -e "s|\${FRONTEND_URL}|${FRONTEND_URL_VAL}|g" \
  "$ROOT_DIR/infra/kong/kong.yml.template" \
  > "$ROOT_DIR/infra/kong/kong.yml"
echo -e "${GREEN}  Kong config generated.${NC}"

# 2. Build and start all containers
echo -e "${YELLOW}Step 2/4: Building and starting all containers...${NC}"
docker compose up -d --build

# 3. Wait for PostgreSQL
echo -e "${YELLOW}Step 3/4: Waiting for PostgreSQL...${NC}"
until docker exec schooldb pg_isready -U admin -d gestor_escolar -q 2>/dev/null; do
  echo -e "${BLUE}  Waiting...${NC}"
  sleep 2
done
echo -e "${GREEN}  PostgreSQL ready!${NC}"

# 4. Run migrations
echo -e "${YELLOW}Step 4/4: Running TypeORM migrations...${NC}"
for svc in ms-identity ms-academic ms-hr ms-finance; do
  echo -e "${BLUE}  → $svc${NC}"

  # Generate if no migration files exist on the host yet
  MIGRATION_COUNT=$(find "$ROOT_DIR/apps/$svc/src/migrations" -name "*.ts" 2>/dev/null | wc -l)
  if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${BLUE}    Generating initial migration...${NC}"
    (cd "$ROOT_DIR/apps/$svc" && DATABASE_HOST=localhost npm run migration:generate -- src/migrations/InitialSchema 2>&1) \
      && echo -e "${GREEN}    Generated.${NC}" \
      || echo -e "${YELLOW}    Could not generate — skipping.${NC}"
    # Rebuild container so it picks up the new migration file
    docker compose build "$svc" --quiet 2>/dev/null || true
    docker compose up -d "$svc"
  fi

  (cd "$ROOT_DIR/apps/$svc" && DATABASE_HOST=localhost npm run migration:run 2>&1) \
    && echo -e "${GREEN}    ✓ applied${NC}" \
    || echo -e "${YELLOW}    ⚠ already up to date${NC}"
done

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}✅ GestorEscolar is running!${NC}"
echo -e "${GREEN}================================================================${NC}"
printf "%-22s | %s\n" "API Gateway (Kong)"  "http://localhost:8000"
printf "%-22s | %s\n" "Frontend"            "http://localhost:5173  (if running locally)"
printf "%-22s | %s\n" "RabbitMQ UI"         "http://localhost:15672"
printf "%-22s | %s\n" "Grafana"             "http://localhost:3000"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo -e "  Logs:  ${YELLOW}docker compose logs -f${NC}"
echo -e "  Stop:  ${YELLOW}docker compose down${NC}"
echo ""
