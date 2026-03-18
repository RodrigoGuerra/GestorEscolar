# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todas as 14 vulnerabilidades de segurança identificadas no relatório de segurança do GestorEscolar, priorizando ALTA → MÉDIA → BAIXA.

**Architecture:** Cada fix é aplicado no nível mais adequado da stack (guard, interceptor, DTO, store, Kong). Onde possível, a mesma mudança é replicada nos 3 microserviços internos (ms-academic, ms-hr, ms-finance) que compartilham a mesma estrutura de guards/interceptors.

**Tech Stack:** NestJS + TypeORM + Zustand + Kong 3.4 + Docker Compose

---

## Mapa de Arquivos

| Arquivo | O que muda |
|---|---|
| `apps/ms-academic/src/common/guards/jwt-extract.guard.ts` | `jwt.decode` → `jwt.verify` |
| `apps/ms-hr/src/common/guards/jwt-extract.guard.ts` | `jwt.decode` → `jwt.verify` |
| `apps/ms-finance/src/common/guards/jwt-extract.guard.ts` | `jwt.decode` → `jwt.verify` |
| `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts` | `jwt.decode` → `jwt.verify` + fix tenant hopping |
| `apps/ms-hr/src/common/interceptors/tenant.interceptor.ts` | `jwt.decode` → `jwt.verify` + fix tenant hopping |
| `apps/ms-finance/src/common/interceptors/tenant.interceptor.ts` | `jwt.decode` → `jwt.verify` + fix tenant hopping |
| `apps/ms-academic/src/app.module.ts` | injetar JWT_SECRET no guard via ConfigService |
| `apps/ms-hr/src/app.module.ts` | idem |
| `apps/ms-finance/src/app.module.ts` | idem |
| `apps/ms-academic/.env` | adicionar `JWT_SECRET=` |
| `apps/ms-hr/.env` | adicionar `JWT_SECRET=` |
| `apps/ms-finance/.env` | adicionar `JWT_SECRET=` |
| `apps/ms-finance/src/invoices/invoices.controller.ts` | remover STUDENT do POST |
| `apps/ms-identity/src/auth/auth.controller.ts` | adicionar @Throttle no /auth/refresh |
| `apps/ms-finance/src/cron/cron.service.ts` | iterar schemas de tenant |
| `apps/ms-academic/src/main.ts` | remover enableCors |
| `apps/ms-hr/src/main.ts` | remover enableCors |
| `apps/ms-finance/src/main.ts` | remover enableCors |
| `apps/ms-identity/src/main.ts` | remover enableCors |
| `apps/ms-academic/src/students/dto/create-student.dto.ts` | validação CPF |
| `apps/ms-hr/src/employees/dto/employee.dto.ts` | validação CPF |
| `apps/frontend/src/stores/authStore.ts` | excluir token do persist (partialize) + alinhar roles |
| `apps/frontend/src/stores/tenantStore.ts` | excluir schema do persist (partialize) |
| `apps/frontend/src/components/RoleGuard.tsx` | alinhar tipos de roles com backend |
| `apps/frontend/src/layout/Sidebar.tsx` | alinhar roles |
| `apps/frontend/src/App.tsx` | init effect para restaurar token do cookie |
| `apps/frontend/src/pages/matriz/Alunos.tsx` | timeout na consulta de CEP |
| `infra/kong/kong.yml.template` | rate limit no /auth/refresh + security headers + remover x-tenant-id dos exposed_headers |
| `docker-compose.yml` | restringir porta 8000 a 127.0.0.1 |

---

## Task 1: JWT verify nos Guards (Alta — #1)

Substituir `jwt.decode()` por `jwt.verify()` nos 3 guards dos microserviços internos. Requer injetar `JWT_SECRET` via `ConfigService`.

**Files:**
- Modify: `apps/ms-academic/src/common/guards/jwt-extract.guard.ts`
- Modify: `apps/ms-hr/src/common/guards/jwt-extract.guard.ts`
- Modify: `apps/ms-finance/src/common/guards/jwt-extract.guard.ts`
- Modify: `apps/ms-academic/.env`
- Modify: `apps/ms-hr/.env`
- Modify: `apps/ms-finance/.env`

- [ ] **Step 1: Adicionar JWT_SECRET nos .env dos 3 microserviços**

Verificar o valor atual em `apps/ms-identity/.env` e copiar para os demais:

```bash
JWT_SECRET=$(grep "^JWT_SECRET=" apps/ms-identity/.env | cut -d'=' -f2-)
echo "JWT_SECRET=${JWT_SECRET}" >> apps/ms-academic/.env
echo "JWT_SECRET=${JWT_SECRET}" >> apps/ms-hr/.env
echo "JWT_SECRET=${JWT_SECRET}" >> apps/ms-finance/.env
```

- [ ] **Step 2: Modificar JwtExtractGuard em ms-academic**

Arquivo: `apps/ms-academic/src/common/guards/jwt-extract.guard.ts`

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtExtractGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined') {
      throw new UnauthorizedException('Missing token');
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret) as any;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = {
      sub: decoded.sub,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tenants: decoded.tenants,
    };

    return true;
  }
}
```

- [ ] **Step 3: Copiar o mesmo guard para ms-hr e ms-finance**

O conteúdo é idêntico. Aplicar o mesmo código em:
- `apps/ms-hr/src/common/guards/jwt-extract.guard.ts`
- `apps/ms-finance/src/common/guards/jwt-extract.guard.ts`

- [ ] **Step 4: Verificar que ConfigService está disponível nos AppModules**

Confirmar que cada `app.module.ts` tem `ConfigModule.forRoot({ isGlobal: true })` (já existe em todos). O guard é registrado como `APP_GUARD` via DI então o `ConfigService` será injetado automaticamente.

- [ ] **Step 5: Fazer o mesmo no TenantInterceptor (decode → verify)**

O `TenantInterceptor` também chama `jwt.decode()` na linha 38. Substituir nos 3 microserviços.

Em `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`:
```typescript
// Linha 21 - adicionar construtor com ConfigService
constructor(private dataSource: DataSource, private configService: ConfigService) {}

// Linhas 37-43 - substituir decode por verify
const token = authHeader.split(' ')[1];
const secret = this.configService.get<string>('JWT_SECRET');
let decoded: any;
try {
  decoded = jwt.verify(token, secret) as any;
} catch {
  throw new UnauthorizedException('Invalid or expired token');
}
if (!decoded) {
  throw new UnauthorizedException('Malformed token');
}
request.user = decoded;
```

Repetir em `apps/ms-hr` e `apps/ms-finance`.

- [ ] **Step 6: Commit**

```bash
git add apps/ms-academic/src/common/guards/jwt-extract.guard.ts \
        apps/ms-hr/src/common/guards/jwt-extract.guard.ts \
        apps/ms-finance/src/common/guards/jwt-extract.guard.ts \
        apps/ms-academic/src/common/interceptors/tenant.interceptor.ts \
        apps/ms-hr/src/common/interceptors/tenant.interceptor.ts \
        apps/ms-finance/src/common/interceptors/tenant.interceptor.ts
git commit -m "security: verify JWT signature in microservice guards (defense in depth)"
```

---

## Task 2: Corrigir Tenant Hopping para ADMIN/MANAGER (Alta — #2)

O bypass para `admin` e `manager` no TenantInterceptor permite acessar qualquer schema. Corrigir para que mesmo admins precisem ter o schema em seus `tenants[]`.

**Files:**
- Modify: `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`
- Modify: `apps/ms-hr/src/common/interceptors/tenant.interceptor.ts`
- Modify: `apps/ms-finance/src/common/interceptors/tenant.interceptor.ts`

- [ ] **Step 1: Identificar o bloco problemático**

Nas linhas 77-89 do TenantInterceptor (mesmo código nos 3 microserviços):

```typescript
// ANTES (bugado): admin/manager bypassa verificação de tenant
const authorized = authorizedTenants.find(
  (t: any) => t.schema === headerTenant,
);
if (
  !authorized &&
  user.role?.toLowerCase() !== 'admin' &&
  user.role?.toLowerCase() !== 'manager'
) {
  throw new ForbiddenException(...);
}
tenantSchema = headerTenant;
```

- [ ] **Step 2: Substituir pelo bloco corrigido**

Remover o bypass de role e sempre verificar se o schema está na lista autorizada do usuário:

```typescript
// DEPOIS: todos os usuários precisam ter o schema em seus tenants
const authorized = authorizedTenants.find(
  (t: any) => t.schema === headerTenant,
);
if (!authorized) {
  throw new ForbiddenException(
    `Access to tenant ${headerTenant} is not authorized`,
  );
}
tenantSchema = headerTenant;
```

Aplicar em `ms-academic`, `ms-hr` e `ms-finance`.

**Nota:** Isso garante que mesmo um usuário com `role: ADMIN` no JWT só acessa schemas que estão na sua lista `tenants[]`. A lista é gerada em `ms-identity/auth.service.ts` durante o login — se o admin tiver acesso a todos os tenants, todos estarão na lista.

- [ ] **Step 3: Commit**

```bash
git add apps/ms-academic/src/common/interceptors/tenant.interceptor.ts \
        apps/ms-hr/src/common/interceptors/tenant.interceptor.ts \
        apps/ms-finance/src/common/interceptors/tenant.interceptor.ts
git commit -m "security: remove admin/manager tenant bypass — enforce authorized tenant list for all roles"
```

---

## Task 3: IDOR no POST /finance/invoices (Alta — #5)

Remover `UserRole.STUDENT` do decorator `@Roles` do método `create()`.

**Files:**
- Modify: `apps/ms-finance/src/invoices/invoices.controller.ts`

- [ ] **Step 1: Separar @Roles por método**

A anotação de classe atual `@Roles(ADMIN, MANAGER, GESTOR, STUDENT)` aplica-se a todos os métodos. Remover a anotação de classe e criar anotações por método:

```typescript
// REMOVER anotação de classe:
// @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.STUDENT)

@Controller('finance/invoices')
export class InvoicesController {

  // Apenas gestores podem criar faturas
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  // Gestores e estudantes podem listar (com filtro IDOR já implementado)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.STUDENT)
  @Get()
  findAll(...) { ... }

  // Gestores e estudantes podem ver uma fatura específica
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.STUDENT)
  @Get(':id')
  findOne(...) { ... }

  // Apenas gestores podem alterar status
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)
  @Patch(':id/status')
  updateStatus(...) { ... }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ms-finance/src/invoices/invoices.controller.ts
git commit -m "security: prevent students from creating invoices (IDOR fix on POST /finance/invoices)"
```

---

## Task 4: Token JWT fora do localStorage (Alta — #3 e #10)

O Zustand persist salva o access token no localStorage por padrão. Usar `partialize` para excluir o `token` da persistência. Adicionar effect de inicialização para restaurar o token do cookie HttpOnly ao carregar a app.

**Files:**
- Modify: `apps/frontend/src/stores/authStore.ts`
- Modify: `apps/frontend/src/App.tsx`

- [ ] **Step 1: Usar partialize no authStore**

```typescript
// apps/frontend/src/stores/authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      unidadeAtual: null,
      setAuth: (token, user) => set({ token, user, role: user.role }),
      login: (userData) => set({ user: userData, role: userData.role, token: userData.token || null }),
      setEscolaSelecionada: (escolaId) => set({ unidadeAtual: escolaId }),
      clearAuth: () => set({ token: null, user: null, role: null, unidadeAtual: null }),
    }),
    {
      name: 'auth-storage',
      // Excluir token da persistência — token é re-obtido do cookie HttpOnly ao iniciar
      partialize: (state) => ({ user: state.user, role: state.role, unidadeAtual: state.unidadeAtual }),
    }
  )
);
```

- [ ] **Step 2: Adicionar init effect no App.tsx para restaurar token**

Quando a app carrega, se o usuário tem dados persistidos (user/role) mas não tem token (pois foi excluído do localStorage), chamar `/auth/token` para obter o token do cookie HttpOnly:

```typescript
// Em App.tsx, dentro do componente App:
useEffect(() => {
  const { token, user, setAuth, clearAuth } = useAuthStore.getState();
  if (user && !token) {
    // Token não está em localStorage — tentar restaurar do cookie HttpOnly
    fetch(`${API_URL}/auth/token`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(({ accessToken, user: freshUser }) => {
        setAuth(accessToken, {
          id: freshUser.userId,
          email: freshUser.email,
          name: freshUser.name || freshUser.email,
          role: freshUser.role,
          tenants: freshUser.tenants,
        });
      })
      .catch(() => clearAuth());
  }
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/stores/authStore.ts apps/frontend/src/App.tsx
git commit -m "security: exclude JWT access token from localStorage persistence (partialize)"
```

---

## Task 5: Schema do Tenant fora do localStorage (Média — #8)

O `tenantStore` persiste o `schema` do PostgreSQL no localStorage. Usar `partialize` para excluir o schema e armazenar apenas `id` e `name`.

**Files:**
- Modify: `apps/frontend/src/stores/tenantStore.ts`
- Modify: `apps/frontend/src/lib/api.ts`

- [ ] **Step 1: Excluir schema do persist e derivar do authStore**

A lista de tenants do usuário (incluindo o schema) está no `user.tenants[]` do authStore. O `api.ts` pode derivar o schema de lá em vez de ler do tenantStore:

```typescript
// apps/frontend/src/stores/tenantStore.ts
interface Tenant {
  id: string;
  name: string;
  // schema removido da interface pública persistida
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
    }),
    {
      name: 'tenant-storage',
      // Apenas id e name são persistidos — schema é sensível (nome do schema PostgreSQL)
      partialize: (state) => ({
        currentTenant: state.currentTenant
          ? { id: state.currentTenant.id, name: state.currentTenant.name }
          : null,
      }),
    }
  )
);
```

- [ ] **Step 2: Atualizar api.ts para derivar schema do authStore**

```typescript
// apps/frontend/src/lib/api.ts — no interceptor de request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const tenant = useTenantStore.getState().currentTenant;
  const user = useAuthStore.getState().user;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenant) {
    // Derivar schema do JWT (user.tenants[]) em vez de ler do localStorage
    const tenantData = user?.tenants?.find((t) => t.id === tenant.id);
    const schema = tenantData?.schema;
    if (schema) {
      config.headers['x-tenant-id'] = schema;
    }
  }

  return config;
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/stores/tenantStore.ts apps/frontend/src/lib/api.ts
git commit -m "security: exclude tenant schema from localStorage — derive from JWT tenants array"
```

---

## Task 6: Alinhar Roles entre Backend e Frontend (Alta — #4)

O frontend define `GESTOR | FUNCIONARIO | ALUNO`, o backend usa `ADMIN | MANAGER | GESTOR | TEACHER | STUDENT | EMPLOYEE`. Expandir o frontend para aceitar as roles do backend.

**Files:**
- Modify: `apps/frontend/src/stores/authStore.ts`
- Modify: `apps/frontend/src/components/RoleGuard.tsx`
- Modify: `apps/frontend/src/layout/Sidebar.tsx`

- [ ] **Step 1: Expandir tipo de role no authStore**

```typescript
// apps/frontend/src/stores/authStore.ts
// Substituir o tipo de role restrito pelo conjunto completo do backend
type UserRole = 'ADMIN' | 'MANAGER' | 'GESTOR' | 'TEACHER' | 'STUDENT' | 'EMPLOYEE';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenants?: { id: string; name: string; schema: string }[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  // ... resto igual
}
```

- [ ] **Step 2: Atualizar RoleGuard para aceitar as novas roles**

```typescript
// apps/frontend/src/components/RoleGuard.tsx
type UserRole = 'ADMIN' | 'MANAGER' | 'GESTOR' | 'TEACHER' | 'STUDENT' | 'EMPLOYEE';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}
```

- [ ] **Step 3: Atualizar Sidebar para usar roles corretas**

```typescript
// apps/frontend/src/layout/Sidebar.tsx
const menuItems: MenuItem[] = [
  { name: 'Dashboard',     icon: LayoutDashboard, href: '/',          roles: ['GESTOR', 'ADMIN', 'MANAGER'] },
  { name: 'Disciplina',    icon: BookOpen,         href: '/subjects',  roles: ['GESTOR', 'ADMIN', 'MANAGER'] },
  { name: 'Alunos',        icon: Users,            href: '/students',  roles: ['GESTOR', 'ADMIN', 'MANAGER'] },
  { name: 'Acadêmico',     icon: School,           href: '/academic',  roles: ['GESTOR', 'ADMIN', 'MANAGER'] },
  { name: 'Colaboradores', icon: Users,            href: '/employees', roles: ['GESTOR', 'ADMIN', 'MANAGER'] },
  { name: 'Financeiro',    icon: CreditCard,       href: '/finance',   roles: ['GESTOR', 'ADMIN', 'MANAGER'] },
];
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/stores/authStore.ts \
        apps/frontend/src/components/RoleGuard.tsx \
        apps/frontend/src/layout/Sidebar.tsx
git commit -m "fix: align frontend role types with backend (ADMIN/MANAGER/GESTOR/TEACHER/STUDENT/EMPLOYEE)"
```

---

## Task 7: Rate Limiting no /auth/refresh (Média — #6)

Adicionar `@Throttle` restritivo no endpoint de refresh.

**Files:**
- Modify: `apps/ms-identity/src/auth/auth.controller.ts`
- Modify: `infra/kong/kong.yml.template`

- [ ] **Step 1: Adicionar @Throttle no método refresh**

```typescript
// apps/ms-identity/src/auth/auth.controller.ts
// Throttle mais restritivo para refresh: máx 5 por minuto por IP
@Throttle({ short: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
@Post('refresh')
async refresh(@Req() req: Request, @Res() res: Response) {
  // ... código existente sem alterações
}
```

- [ ] **Step 2: Adicionar rate limit específico para /auth/refresh no Kong**

No `infra/kong/kong.yml.template`, adicionar plugin de rate-limiting na rota `identity-public-route` para o path `/auth/refresh`:

```yaml
# Separar /auth/refresh em sua própria rota com rate limit mais restritivo
- name: identity-refresh-route
  paths:
    - /auth/refresh
  strip_path: false
  plugins:
    - name: rate-limiting
      config:
        minute: 10
        policy: redis
        redis_host: redis
        redis_port: 6379
```

- [ ] **Step 3: Commit**

```bash
git add apps/ms-identity/src/auth/auth.controller.ts infra/kong/kong.yml.template
git commit -m "security: add stricter rate limiting on /auth/refresh endpoint"
```

---

## Task 8: Remover CORS dos Microserviços Internos (Média — #7)

Os microserviços só devem ser acessíveis via Kong. Remover `app.enableCors()` de todos.

**Files:**
- Modify: `apps/ms-academic/src/main.ts`
- Modify: `apps/ms-hr/src/main.ts`
- Modify: `apps/ms-finance/src/main.ts`
- Modify: `apps/ms-identity/src/main.ts`

- [ ] **Step 1: Remover enableCors dos 4 microserviços**

Em cada `main.ts`, remover as linhas:
```typescript
// REMOVER estas linhas de todos os main.ts:
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.enableCors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
});
```

O CORS é responsabilidade exclusiva do Kong (já configurado em `kong.yml.template`).

**Nota:** `ms-identity` tem CORS para os endpoints OAuth — esses são acessados pelo browser via redirecionamento, não por fetch. O CORS nos OAuth callbacks é irrelevante (são redirects, não XHR). Pode ser removido com segurança.

- [ ] **Step 2: Commit**

```bash
git add apps/ms-academic/src/main.ts \
        apps/ms-hr/src/main.ts \
        apps/ms-finance/src/main.ts \
        apps/ms-identity/src/main.ts
git commit -m "security: remove CORS from internal microservices — CORS handled exclusively by Kong"
```

---

## Task 9: Validação de CPF nos DTOs (Média — #9)

Adicionar `@Matches` com regex de CPF nos campos `cpf` dos DTOs de estudante e funcionário.

**Files:**
- Modify: `apps/ms-academic/src/students/dto/create-student.dto.ts`
- Modify: `apps/ms-hr/src/employees/dto/employee.dto.ts`

- [ ] **Step 1: Adicionar validação de CPF no DTO de estudante**

```typescript
// apps/ms-academic/src/students/dto/create-student.dto.ts
import { Matches } from 'class-validator'; // adicionar ao import existente

// Substituir o campo cpf:
@IsString()
@IsNotEmpty()
@Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
  message: 'CPF deve estar no formato 000.000.000-00',
})
cpf: string;

// E o guardianCpf (opcional):
@IsString()
@IsOptional()
@Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
  message: 'CPF do responsável deve estar no formato 000.000.000-00',
})
guardianCpf?: string;
```

- [ ] **Step 2: Adicionar validação de CPF no DTO de funcionário**

```typescript
// apps/ms-hr/src/employees/dto/employee.dto.ts
import { Matches } from 'class-validator'; // adicionar ao import

@IsString()
@IsNotEmpty()
@Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
  message: 'CPF deve estar no formato 000.000.000-00',
})
cpf: string;
```

- [ ] **Step 3: Commit**

```bash
git add apps/ms-academic/src/students/dto/create-student.dto.ts \
        apps/ms-hr/src/employees/dto/employee.dto.ts
git commit -m "fix: add CPF format validation on student and employee DTOs"
```

---

## Task 10: CronService com Isolamento de Tenant (Média — #11)

O cron job de faturas vencidas opera no schema `public` e nunca encontra faturas dos tenants. Corrigir para iterar sobre todos os schemas ativos.

**Files:**
- Modify: `apps/ms-finance/src/cron/cron.service.ts`

- [ ] **Step 1: Reescrever handleOverdueInvoices para iterar schemas**

Estratégia: buscar todos os schemas de tenant no `pg_namespace` que correspondem ao padrão de naming (todos que não são schemas do sistema), então executar a query de update em cada um com um `QueryRunner` dedicado.

```typescript
// apps/ms-finance/src/cron/cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';
import { ClientProxy, ClientProxyFactory, RmqRecord, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

// Schemas do sistema que nunca devem ser processados
const SYSTEM_SCHEMAS = ['public', 'pg_catalog', 'information_schema', 'pg_toast'];

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private client: ClientProxy;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URL')!],
        queue: 'school_events_queue',
        queueOptions: { durable: true },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueInvoices() {
    this.logger.log('Running cron job to update overdue invoices across all tenant schemas...');

    // Buscar todos os schemas de tenant (exclui schemas do sistema e schemas que começam com 'pg_')
    const schemaRows: { nspname: string }[] = await this.dataSource.query(
      `SELECT nspname FROM pg_namespace
       WHERE nspname NOT IN (${SYSTEM_SCHEMAS.map((_, i) => `$${i + 1}`).join(',')})
         AND nspname NOT LIKE 'pg_%'`,
      SYSTEM_SCHEMAS,
    );

    const today = new Date().toISOString().split('T')[0];
    let totalUpdated = 0;

    for (const { nspname } of schemaRows) {
      const qr = this.dataSource.createQueryRunner();
      try {
        await qr.connect();
        await qr.query(`SET search_path TO "${nspname}", public`);

        const overdueInvoices: any[] = await qr.query(
          `SELECT id, "studentId", "schoolId", amount, "dueDate"
           FROM invoices
           WHERE status = $1 AND "dueDate" < $2`,
          [InvoiceStatus.PENDING, today],
        );

        for (const invoice of overdueInvoices) {
          await qr.query(
            `UPDATE invoices SET status = $1 WHERE id = $2`,
            [InvoiceStatus.OVERDUE, invoice.id],
          );

          this.client.emit(
            'student.overdue',
            new RmqRecord(
              {
                invoiceId: invoice.id,
                studentId: invoice.studentId,
                schoolId: invoice.schoolId,
                amount: invoice.amount,
                dueDate: invoice.dueDate,
              },
              { persistent: true },
            ),
          );
          totalUpdated++;
        }
      } catch (err) {
        this.logger.warn(`Schema "${nspname}" skipped: ${err.message}`);
      } finally {
        await qr.release();
      }
    }

    this.logger.log(`Updated ${totalUpdated} invoices to OVERDUE across ${schemaRows.length} schemas.`);
  }
}
```

- [ ] **Step 2: Atualizar InvoicesModule para injetar DataSource**

O `CronService` não precisa mais do `@InjectRepository(Invoice)` — usa `DataSource` diretamente. Remover a dependência de `TypeOrmModule.forFeature([Invoice])` no `CronService` (mas manter para `InvoicesService`). O `DataSource` é disponível globalmente via TypeORM.

- [ ] **Step 3: Commit**

```bash
git add apps/ms-finance/src/cron/cron.service.ts
git commit -m "fix: cron job now processes overdue invoices across all tenant schemas"
```

---

## Task 11: Restringir Porta Kong e Security Headers (Média — #12 e #14)

**Files:**
- Modify: `docker-compose.yml`
- Modify: `infra/kong/kong.yml.template`

- [ ] **Step 1: Restringir portas do Kong no docker-compose.yml**

```yaml
# docker-compose.yml — seção ports do Kong
ports:
  - "127.0.0.1:8000:8000"   # HTTP — apenas loopback (dev local)
  - "127.0.0.1:8443:8443"   # HTTPS — apenas loopback (dev local)
  - "127.0.0.1:8001:8001"   # Admin — já estava correto
  - "127.0.0.1:8444:8444"   # Admin HTTPS
```

- [ ] **Step 2: Adicionar security headers e remover x-tenant-id dos exposed_headers**

No `infra/kong/kong.yml.template`, adicionar plugin `response-transformer` global e limpar `exposed_headers`:

```yaml
plugins:
  # ... plugins existentes ...

  # Remover x-tenant-id dos exposed_headers no plugin cors:
  # exposed_headers:
  #   - X-Auth-Token        ← manter
  #   - Authorization       ← manter
  # (remover x-tenant-id)

  # Adicionar security headers:
  - name: response-transformer
    config:
      add:
        headers:
          - "X-Content-Type-Options: nosniff"
          - "X-Frame-Options: DENY"
          - "Strict-Transport-Security: max-age=31536000; includeSubDomains"
          - "Referrer-Policy: strict-origin-when-cross-origin"
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml infra/kong/kong.yml.template
git commit -m "security: restrict Kong ports to loopback and add HTTP security headers"
```

---

## Task 12: Timeout na Consulta de CEP (Baixa — #13)

**Files:**
- Modify: `apps/frontend/src/pages/matriz/Alunos.tsx`

- [ ] **Step 1: Adicionar timeout na chamada ao ViaCEP**

Localizar a linha com `fetch(`https://viacep.com.br/ws/${cep}/json/`)` e adicionar `AbortSignal.timeout(5000)`:

```typescript
const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
  signal: AbortSignal.timeout(5000),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/matriz/Alunos.tsx
git commit -m "fix: add 5s timeout to ViaCEP external fetch"
```

---

## Task 13: Verificação Final

- [ ] **Step 1: Rebuild e restart dos containers**

```bash
docker compose down
bash scripts/start-local.sh
```

- [ ] **Step 2: Verificar que o login ainda funciona**

Acessar `http://localhost:5173`, fazer login via Google, confirmar que:
- O sidebar mostra todos os itens (role GESTOR)
- As APIs `/academic`, `/finance`, `/hr` respondem com 200
- O localStorage não contém mais o access token (verificar no DevTools → Application → Local Storage)

- [ ] **Step 3: Verificar que JWT forjado é rejeitado**

```bash
# Tentar acessar ms-academic com JWT sem assinatura válida
curl -s http://localhost:8000/academic/schools \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdHRhY2tlciIsInJvbGUiOiJBRE1JTiJ9." \
  -H "x-tenant-id: public" | jq .
# Esperado: 401 Unauthorized
```

- [ ] **Step 4: Verificar que STUDENT não pode criar invoice**

Requer um usuário com role STUDENT. Verificar no código que `@Roles` no POST não inclui STUDENT.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "docs: update security fixes implementation plan — all tasks complete" || true
```
