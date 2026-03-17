# Security Hardening — Task Board

> Plano de correção gerado a partir da auditoria de segurança de 2026-03-17.
> Cada tarefa tem um ID único. Marque com `[x]` ao concluir.
> Issues organizados por sprint — **implemente em ordem**, pois sprints posteriores dependem dos anteriores.

---

## Sprint 1 — Correções Cirúrgicas
> Sem mudança arquitetural. Baixo risco. Pode ser deployado de forma independente.

### F1 — SQL Injection via `x-tenant-id` no `SET search_path` ✅
- **Criticidade:** CRÍTICA
- **Arquivos:** `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`, `apps/ms-hr/src/common/interceptors/tenant.interceptor.ts`, `apps/ms-finance/src/common/interceptors/tenant.interceptor.ts`
- [x] Adicionar constante `VALID_SCHEMA_RE = /^[a-z][a-z0-9_]{0,62}$/` antes do bloco do QueryRunner nos 3 interceptors
- [x] Lançar `BadRequestException` se o schema não passar na regex
- [x] Manter `'public'` como caso especial isento da regex (já é validado pelo gate de roles)

### F2 — Endpoint `/users/provision` e `/users/:email` sem autenticação ✅
- **Criticidade:** CRÍTICA
- **Arquivos:** `apps/ms-identity/src/users/users.controller.ts`, `apps/ms-identity/src/users/users.module.ts`
- [x] Adicionar `PassportModule` e `JwtModule.registerAsync` diretamente em `UsersModule` (evitar circular dependency com `AuthModule`)
- [x] Adicionar `JwtStrategy` nos providers de `UsersModule`
- [x] Adicionar `@UseGuards(AuthGuard('jwt'))` na classe `UsersController`

### F3 — JWT token exposto na URL do redirect OAuth ✅
- **Criticidade:** CRÍTICA
- **Arquivos:** `apps/ms-identity/src/auth/auth.controller.ts`, `apps/ms-identity/src/auth/strategies/jwt.strategy.ts`, `apps/ms-identity/src/main.ts`, `apps/frontend/src/pages/LoginSuccess.tsx`
- [x] Instalar `cookie-parser` e `@types/cookie-parser` em `apps/ms-identity`
- [x] Adicionar `app.use(cookieParser())` em `ms-identity/src/main.ts`
- [x] Adicionar `NODE_ENV`, `FRONTEND_URL`, `COOKIE_DOMAIN` ao `.env.example` do ms-identity
- [x] Substituir `res.redirect('...?token=...')` por `res.cookie('auth_token', token, { httpOnly: true, secure: isProd, sameSite: 'strict' })` + `res.redirect(frontendUrl)`
- [x] Adicionar endpoint `GET /auth/token` protegido por cookie para o frontend trocar cookie por token
- [x] Atualizar `JwtStrategy` para extrair token do cookie como extractor primário, mantendo Bearer como fallback
- [x] Atualizar `LoginSuccess.tsx`: chamar `GET /auth/token` com `credentials: 'include'` para hidratar a store
- [ ] **AÇÃO MANUAL:** Adicionar `NODE_ENV=development`, `FRONTEND_URL=http://localhost:5173`, `COOKIE_DOMAIN=` nos `.env` locais

### F4 — Stack trace retornado ao cliente HTTP ✅ (corrigido junto com F3)
- **Criticidade:** ALTA
- **Arquivo:** `apps/ms-identity/src/auth/auth.controller.ts`
- [x] Remover `error.message` e `error.stack` do response body
- [x] Usar `this.logger.error(msg, error.stack)` para logar server-side

### F5 — JWT sem algoritmo fixo (algorithm pinning) ✅
- **Criticidade:** ALTA
- **Arquivos:** `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`, `apps/ms-hr/src/common/interceptors/tenant.interceptor.ts`, `apps/ms-finance/src/common/interceptors/tenant.interceptor.ts`
- [x] Adicionar `{ algorithms: ['HS256'] }` como terceiro argumento em todos os `jwt.verify()` nos 3 interceptors

### F6 — Arquivos `.env` protegidos no git ✅
- **Criticidade:** CRÍTICA
- **Arquivos:** `.gitignore`, todos os `apps/*/.env`
- [x] Atualizar `.gitignore` root: adicionar `apps/**/.env` e `apps/**/.env.local`
- [x] Verificado: `.env` nunca foram commitados (já estavam fora do tracking)
- [x] Criar `apps/ms-identity/.env.example` com todas as chaves e valores placeholder
- [x] Criar `apps/ms-academic/.env.example`
- [x] Criar `apps/ms-hr/.env.example`
- [x] Criar `apps/ms-finance/.env.example`
- [x] Criar `apps/ms-notification/.env.example`
- [ ] **AÇÃO MANUAL OBRIGATÓRIA:** Revogar `GOOGLE_CLIENT_SECRET` no Google Cloud Console e gerar novo
- [ ] **AÇÃO MANUAL OBRIGATÓRIA:** Gerar novo `JWT_SECRET` forte (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) e atualizar em todos os `.env`

### F7 — Kong Admin API exposta publicamente na porta 8001 ✅
- **Criticidade:** CRÍTICA
- **Arquivo:** `docker-compose.yml`
- [x] Mudar `KONG_ADMIN_LISTEN` de `0.0.0.0:8001` para `127.0.0.1:8001, 127.0.0.1:8444 ssl`
- [x] Mudar port binding de `"8001:8001"` para `"127.0.0.1:8001:8001"`

### F8 — `franchiseSchema` no DTO sem validação de formato ✅
- **Criticidade:** ALTA
- **Arquivo:** `apps/ms-identity/src/users/dto/provision-user.dto.ts`
- [x] Adicionar `@Matches(/^[a-z][a-z0-9_]{0,62}$/)` no campo `franchiseSchema`
- [x] Adicionar role `GESTOR` no enum `UserRole` (estava faltando)
- [x] `ValidationPipe({ whitelist: true })` já ativo em `ms-identity/src/main.ts`

---

## Sprint 2 — Autenticação, RBAC e Infraestrutura
> Depende do Sprint 1 estar concluído. Requer `docker-compose up --build`.

### F9 — Kong sem plugin de autenticação (gateway é proxy puro) ✅
- **Criticidade:** CRÍTICA
- **Arquivo:** `infra/kong/kong.yml`
- [x] Adicionar consumer `gestor-escolar-app` com `jwt_secrets` no `kong.yml`
- [x] Adicionar `KONG_JWT_SECRET` no `.env.example` raiz e repassar ao Kong via env no docker-compose
- [x] Adicionar plugin `jwt` (com `claims_to_verify: [exp]`) nas rotas de ms-academic, ms-hr, ms-finance, ms-notification
- [x] Manter rotas `/auth/google`, `/auth/token` do ms-identity **sem** o plugin JWT (são públicas por design)
- [x] Adicionar `issuer: 'gestor-escolar-app'` no `signOptions` do `JwtModule` em `ms-identity/src/auth/auth.module.ts` e `users.module.ts`

### F10 — TenantInterceptors re-verificando JWT (redundante após F9) ✅
- **Criticidade:** ALTA
- **Arquivos:** `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`, `apps/ms-hr/src/common/interceptors/tenant.interceptor.ts`, `apps/ms-finance/src/common/interceptors/tenant.interceptor.ts`
- [x] Substituir `jwt.verify(token, secret, { algorithms: ['HS256'] })` por `jwt.decode(token)` nos 3 interceptors
- [x] Remover `ConfigService` do constructor dos 3 interceptors
- [x] Adicionar verificação `if (!decoded) throw new UnauthorizedException('Malformed token')`

### F11 — Sem guards RBAC em nenhum controller ✅
- **Criticidade:** CRÍTICA
- **Arquivos:** vários (ver subtarefas)
- [x] Criar `apps/ms-academic/src/common/enums/user-role.enum.ts` com enum `UserRole` canônico
- [x] Criar mesmo arquivo em `apps/ms-hr/src/common/enums/` e `apps/ms-finance/src/common/enums/`
- [x] Criar `apps/ms-academic/src/common/guards/jwt-extract.guard.ts` (decodifica JWT e popula `request.user`)
- [x] Criar mesmo guard em `apps/ms-hr/src/common/guards/` e `apps/ms-finance/src/common/guards/`
- [x] Criar `apps/ms-academic/src/common/guards/roles.guard.ts` (lê `ROLES_KEY` do Reflector e valida `request.user.role`)
- [x] Criar mesmo guard em `apps/ms-hr/src/common/guards/` e `apps/ms-finance/src/common/guards/`
- [x] Criar `apps/ms-academic/src/common/decorators/roles.decorator.ts`
- [x] Criar mesmo decorator em `apps/ms-hr/src/common/decorators/` e `apps/ms-finance/src/common/decorators/`
- [x] Registrar `APP_GUARD` (ThrottlerGuard → JwtExtractGuard → RolesGuard) em `ms-academic/src/app.module.ts`
- [x] Registrar mesmos guards em `ms-hr/src/app.module.ts` e `ms-finance/src/app.module.ts`
- [x] Aplicar `@Roles()` nos controllers do ms-academic (students, schools, grades, classes, subjects)
- [x] Aplicar `@Roles()` nos controllers do ms-hr (employees, time-records)
- [x] Aplicar `@Roles()` nos controllers do ms-finance (invoices, transactions)

### F12 — Rate limiting ausente (DDoS) ✅
- **Criticidade:** ALTA
- **Arquivos:** `apps/*/package.json`, `apps/*/src/app.module.ts`, `apps/ms-identity/src/auth/auth.controller.ts`
- [x] Instalar `@nestjs/throttler` nos 5 serviços
- [x] Adicionar `ThrottlerModule.forRoot([{ name: 'short', ttl: 1000, limit: 20 }, { name: 'long', ttl: 60000, limit: 500 }])` em cada `app.module.ts`
- [x] Adicionar `{ provide: APP_GUARD, useClass: ThrottlerGuard }` como primeiro guard em cada `app.module.ts`
- [x] Aplicar `@Throttle({ short: { limit: 5 }, long: { limit: 20 } })` nos endpoints OAuth do `auth.controller.ts`

### F13 — CORS wildcard em todos os serviços ✅
- **Criticidade:** ALTA
- **Arquivos:** `apps/*/src/main.ts`
- [x] Substituir `app.enableCors()` por `app.enableCors({ origin: allowedOrigins, credentials: true, ... })` nos 3 `main.ts` (ms-academic, ms-hr, ms-finance)
- [x] Ler `FRONTEND_URL` do env (com fallback para `http://localhost:5173` em dev)
- [x] Corrigir Kong `kong.yml`: substituir `origins: ["*"]` por `${FRONTEND_URL}`

### F14 — Credenciais hardcoded no `docker-compose.yml` ✅
- **Criticidade:** ALTA
- **Arquivo:** `docker-compose.yml`
- [x] Substituir `password123`, `guest/guest`, `admin` por `${POSTGRES_PASSWORD}`, `${RABBITMQ_PASS}`, `${GRAFANA_ADMIN_PASSWORD}`
- [x] Criar `.env.example` na raiz do projeto com todas as variáveis do docker-compose
- [x] `.env` (raiz) já estava no `.gitignore` — verificado

### F15 — Microserviços acessíveis direto (bypassando Kong) ✅
- **Criticidade:** ALTA
- **Arquivos:** `docker-compose.yml`, `infra/kong/kong.yml`, `apps/*/Dockerfile` (novos)
- [x] Criar `Dockerfile` em `apps/ms-identity/`
- [x] Criar `Dockerfile` em `apps/ms-academic/`
- [x] Criar `Dockerfile` em `apps/ms-hr/`
- [x] Criar `Dockerfile` em `apps/ms-finance/`
- [x] Criar `Dockerfile` em `apps/ms-notification/`
- [x] Adicionar rede `gestor-net` no `docker-compose.yml`
- [x] Mover todos os microserviços para a rede interna (usar `expose` em vez de `ports`)
- [x] Atualizar URLs no `kong.yml` de `http://host.docker.internal:300X` para `http://ms-{nome}:300X`
- [x] Remover `extra_hosts` do serviço kong no `docker-compose.yml`
- [x] Atualizar `DATABASE_HOST` para `postgres` e `RABBITMQ_URL` para `amqp://rabbitmq:5672` nos `.env.example`

---

## Sprint 3 — Isolamento Multitenant (Correção Arquitetural)
> Mais complexo. Depende do Sprint 2. Requer testes de integração após.

### F16 — `search_path` no QueryRunner não afeta repositórios (tenant isolation broken)
- **Criticidade:** CRÍTICA (falha arquitetural — dados não estão isolados por tenant)
- **Arquivos:** vários (ver subtarefas)

#### 3.1 Infraestrutura compartilhada (criar por microserviço: ms-academic, ms-hr, ms-finance)
- [ ] Criar `src/common/tenant/tenant-repository.service.ts` (REQUEST-scoped, expõe `getRepository<T>()` via `queryRunner.manager`)
- [ ] Criar `src/common/tenant/tenant.module.ts` (declara e exporta `TenantRepositoryService`)
- [ ] Atualizar `TenantInterceptor` nos 3 serviços: além de `SET search_path`, salvar `request['queryRunner'] = queryRunner` (antes já salva `request['tenantSchema']`)

#### 3.2 Migração dos services do ms-academic
- [ ] Migrar `StudentsService`: substituir `@InjectRepository(Student)` por `TenantRepositoryService`
- [ ] Atualizar `StudentsModule`: remover `TypeOrmModule.forFeature([Student])`, importar `TenantModule`
- [ ] Migrar `SchoolsService` (atenção: tem `createQueryBuilder` → usar `tenantRepo.getQueryRunner().manager.createQueryBuilder()`)
- [ ] Atualizar `SchoolsModule`
- [ ] Migrar `SubjectsService` + atualizar `SubjectsModule`
- [ ] Migrar `ClassesService` + atualizar `ClassesModule`
- [ ] Migrar `GradesService` + atualizar `GradesModule`
- [ ] Remover `TypeOrmModule.forFeature([...])` redundante do `app.module.ts` do ms-academic

#### 3.3 Migração dos services do ms-hr
- [ ] Migrar `EmployeesService` + atualizar `EmployeesModule`
- [ ] Migrar `TimeRecordsService` + atualizar `TimeRecordsModule`
- [ ] Remover `TypeOrmModule.forFeature([...])` redundante do `app.module.ts` do ms-hr

#### 3.4 Migração dos services do ms-finance
- [ ] Migrar `InvoicesService` + atualizar `InvoicesModule`
- [ ] Migrar `TransactionsService` + atualizar `TransactionsModule`
- [ ] **NÃO migrar** `CronService` — ele não tem contexto HTTP; deve continuar usando `DataSource` diretamente com QueryRunner próprio
- [ ] Remover `TypeOrmModule.forFeature([...])` redundante do `app.module.ts` do ms-finance

### F17 — Tenant hopping para usuários admin/manager
- **Criticidade:** CRÍTICA
- **Arquivos:** `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts` (e equivalentes)
- [ ] No branch do interceptor onde user é admin e schema não está no JWT, fazer query `SELECT nspname FROM pg_namespace WHERE nspname = $1` para validar que o schema existe
- [ ] Lançar `ForbiddenException` se schema não existir no `pg_namespace`

### F18 — IDOR nos endpoints de recursos
- **Criticidade:** ALTA
- **Arquivos:** services de invoices, time-records, employees
- [ ] `InvoicesService.findByStudent()`: verificar que `student_id` pertence ao tenant atual (o `search_path` garante o tenant, mas validar que o user autenticado é o próprio aluno ou um gestor)
- [ ] `TimeRecordsController.getByEmployee()`: verificar que `employeeId` do path corresponde ao `userId` do token (ou que o caller tem role GESTOR/ADMIN)
- [ ] `TimeRecordsService.punch()`: verificar que o `employeeId` do body corresponde ao `userId` do token ou que o caller tem role GESTOR/ADMIN

---

## Sprint 4 — Médios e Preparação para Produção
> Pode ser executado parcialmente em paralelo com Sprint 3.

### F19 — Mass assignment em `updateProfile`
- **Criticidade:** MÉDIA
- **Arquivo:** `apps/ms-identity/src/users/users.service.ts`
- [ ] Criar `UpdateProfileDto` com apenas `name` e qualquer outro campo que o usuário pode auto-editar
- [ ] Substituir `Partial<User>` por `UpdateProfileDto` no método `updateProfile`

### F20 — `synchronize: true` em todos os módulos TypeORM
- **Criticidade:** MÉDIA
- **Arquivos:** `apps/*/src/app.module.ts`
- [ ] Mudar `synchronize: false` em todos os `app.module.ts` (5 serviços)
- [ ] Criar pasta `apps/ms-identity/src/migrations/` e gerar migration inicial via `typeorm migration:generate`
- [ ] Criar migrations iniciais para ms-academic, ms-hr, ms-finance
- [ ] Adicionar `migrations: [__dirname + '/migrations/*.js']` e `migrationsRun: true` no TypeORM config de cada serviço

### F21 — Filas RabbitMQ com `durable: false`
- **Criticidade:** MÉDIA
- **Arquivos:** `apps/ms-notification/src/main.ts`, `apps/ms-finance/src/cron/cron.service.ts`
- [ ] Mudar `queueOptions: { durable: false }` para `durable: true` em `ms-notification/src/main.ts`
- [ ] Mudar `durable: false` para `durable: true` em `ms-finance/src/cron/cron.service.ts`
- [ ] Adicionar `persistent: true` nas opções de publicação de mensagens

### F22 — `console.log` com dados sensíveis em ms-academic
- **Criticidade:** MÉDIA
- **Arquivo:** `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`
- [ ] Substituir todos os `console.log` / `console.warn` / `console.error` por `this.logger.debug()` / `this.logger.warn()` / `this.logger.error()` usando o `Logger` do NestJS

### F23 — Kong rate-limit com `policy: local` (ineficaz em multi-instância)
- **Criticidade:** ALTA
- **Arquivo:** `infra/kong/kong.yml`
- [ ] Adicionar serviço Redis no `docker-compose.yml` (já existe — verificar se está na mesma rede)
- [ ] Mudar `policy: local` para `policy: redis` nos plugins de rate-limiting
- [ ] Adicionar `redis_host` e `redis_port` na configuração do plugin

### F24 — Token refresh ausente (tokens de 24h irrevogáveis)
- **Criticidade:** ALTA
- **Arquivos:** `apps/ms-identity/src/auth/auth.service.ts`, `apps/ms-identity/src/auth/auth.controller.ts`, `apps/ms-identity/src/auth/auth.module.ts`
- [ ] Instalar `ioredis` em ms-identity
- [ ] Criar método `generateRefreshToken()` em `AuthService` (token aleatório, 30 dias, salvo no Redis com TTL)
- [ ] Criar endpoint `POST /auth/refresh` que: lê refresh token do cookie, valida no Redis, emite novo access token
- [ ] Criar endpoint `POST /auth/logout` que: invalida o refresh token no Redis, limpa os cookies
- [ ] Mudar `expiresIn` do access token de `'1d'` para `'15m'`
- [ ] Salvar refresh token em cookie `HttpOnly` separado (`refresh_token`)
- [ ] Atualizar frontend para chamar `/auth/refresh` automaticamente quando access token expirar (interceptar 401)

---

## Checklist de Verificação por Sprint

### Após Sprint 1
- [ ] Todos os 3 interceptors têm validação de schema name
- [ ] `POST /api/v1/users/provision` retorna 401 sem token
- [ ] Redirect OAuth vai para `/` com cookie HttpOnly (não tem `?token=` na URL)
- [ ] `.env` não aparece em `git status` após git rm --cached
- [ ] Kong Admin API não responde em `curl http://localhost:8001` de fora do container

### Após Sprint 2
- [ ] `curl http://localhost:8000/academic/students` sem token retorna 401
- [ ] `curl http://localhost:8000/academic/students` com token de STUDENT retorna 403 em endpoints de DELETE
- [ ] Microserviços não acessíveis direto: `curl http://localhost:3002` deve falhar (timeout)
- [ ] `docker-compose up` funciona sem `.env` exposto no repositório

### Após Sprint 3
- [ ] Criar 2 tenants diferentes, inserir dados em cada um, verificar que `GET /academic/students` com header `x-tenant-id: tenant_a` retorna apenas dados do tenant A
- [ ] Nenhum `@InjectRepository()` restante nos services migrados
- [ ] `CronService` ainda funciona (usa DataSource diretamente)

### Após Sprint 4
- [ ] `synchronize: false` em produção — testar que startup não dropa/altera tabelas
- [ ] Logout invalida token (chamar `/auth/logout`, tentar usar o refresh token antigo — deve retornar 401)
- [ ] Restart do RabbitMQ não perde mensagens pendentes em fila

---

## Notas de Implementação

- **Ordem de guards no `APP_GUARD`:** `ThrottlerGuard` → `JwtExtractGuard` → `RolesGuard` (nessa ordem no array de providers)
- **REQUEST scope cascade:** ao injetar `TenantRepositoryService` (REQUEST-scoped), o service pai automaticamente vira REQUEST-scoped. Não injetar em singletons (globals, APP_GUARD providers).
- **`CronService` nunca usa `TenantRepositoryService`** — ele não tem contexto HTTP.
- **Database host em Docker:** após F15, todos os `.env` dos serviços devem ter `DATABASE_HOST=postgres` (nome do container), não `localhost`.
- **Rota `/auth/google/callback`** deve permanecer sem o plugin JWT no Kong.
- **Rotação de secrets:** após F6, atualizar o mesmo `JWT_SECRET` em TODOS os serviços (ms-identity, ms-academic, ms-hr, ms-finance) — todos verificam/decodificam o mesmo token.
