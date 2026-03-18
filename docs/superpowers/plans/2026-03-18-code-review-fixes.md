# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 10 findings identificados na revisão de código (3 alto, 4 médio, 3 baixo), priorizando os de maior impacto primeiro.

**Architecture:** Cada task é independente — fixes em ms-identity (autorização, dead code, Redis, TypeORM), ms-academic (tenant interceptor, assignToClass) e frontend (localStorage, init flow). A ordem segue severidade decrescente.

**Tech Stack:** NestJS, TypeORM, Zustand (React), Jest, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-18-code-review-design.md`

---

## Mapa de Arquivos

| Arquivo | Responsabilidade | Ação |
|---------|-----------------|------|
| `apps/ms-identity/src/app.module.ts` | Módulo raiz do ms-identity | Modificar: adicionar RolesGuard global |
| `apps/ms-identity/src/common/guards/roles.guard.ts` | Guard de papéis | Criar |
| `apps/ms-identity/src/common/decorators/roles.decorator.ts` | Decorator @Roles | Criar |
| `apps/ms-identity/src/users/users.controller.ts` | Endpoints de usuário | Modificar: adicionar @Roles em provision e findByEmail |
| `apps/ms-identity/src/auth/auth.controller.ts` | Endpoints de autenticação | Modificar: remover accessToken do body de /auth/token |
| `apps/ms-identity/src/auth/auth.service.ts` | Lógica de autenticação | Modificar: remover login(), corrigir findByIds |
| `apps/ms-identity/src/auth/refresh-token.service.ts` | Gerenciamento de refresh tokens | Modificar: logar erros Redis em vez de silenciar |
| `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts` | Interceptor multi-tenant | Modificar: remover verificação dupla de JWT |
| `apps/ms-hr/src/common/interceptors/tenant.interceptor.ts` | Interceptor multi-tenant (hr) | Modificar: mesma correção |
| `apps/ms-finance/src/common/interceptors/tenant.interceptor.ts` | Interceptor multi-tenant (finance) | Modificar: mesma correção |
| `apps/ms-academic/src/students/students.service.ts` | Serviço de estudantes | Modificar: implementar assignToClass de verdade |
| `apps/ms-academic/src/students/students.controller.ts` | Controller de estudantes | Modificar: adicionar rota POST /:id/classes/:classId |
| `apps/ms-academic/src/students/students.service.spec.ts` | Testes do StudentsService | Modificar: atualizar teste de assignToClass |
| `apps/frontend/src/stores/authStore.ts` | Estado de autenticação | Modificar: remover schema do partialize |
| `apps/frontend/src/pages/LoginSuccess.tsx` | Página pós-login OAuth | Modificar: usar /auth/refresh em vez de /auth/token |
| `apps/frontend/src/App.tsx` | Init de sessão | Modificar: usar /auth/refresh em vez de /auth/token |
| `apps/frontend/src/lib/api.ts` | Cliente HTTP | Modificar: adicionar helper decodeJwtPayload |
| `apps/ms-identity/src/users/dto/provision-user.dto.ts` | DTO de provisionamento | Modificar: adicionar validação de tamanho |
| `apps/ms-identity/src/common/validators/max-object-size.validator.ts` | Validator customizado | Criar |

---

## Task 1 — Adicionar RolesGuard global no ms-identity e proteger endpoints (A1 + A2)

**Contexto:** O ms-identity não tem RolesGuard. Os endpoints `POST /provision` e `GET /users/:email` não têm `@Roles()`, então qualquer usuário autenticado (inclusive STUDENT) pode provisionar novos usuários e enumerar perfis alheios.

**Arquivos:**
- Criar: `apps/ms-identity/src/common/guards/roles.guard.ts`
- Criar: `apps/ms-identity/src/common/decorators/roles.decorator.ts`
- Modificar: `apps/ms-identity/src/app.module.ts`
- Modificar: `apps/ms-identity/src/users/users.controller.ts`

- [ ] **Step 1: Criar o RolesGuard no ms-identity**

Criar `apps/ms-identity/src/common/guards/roles.guard.ts`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = user?.role?.toUpperCase();

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Role '${userRole}' is not authorized to access this resource`,
      );
    }

    return true;
  }
}
```

Criar `apps/ms-identity/src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 2: Registrar RolesGuard como APP_GUARD no app.module.ts**

O arquivo já tem `import { APP_GUARD } from '@nestjs/core'` na linha 5 — **não duplicar**.
Adicionar apenas o import do `RolesGuard` e o provider:

```typescript
// Adicionar APENAS esta linha de import (APP_GUARD já existe):
import { RolesGuard } from './common/guards/roles.guard';

// No array providers, adicionar após o ThrottlerGuard existente:
{ provide: APP_GUARD, useClass: RolesGuard },
```

O ms-identity usa `AuthGuard('jwt')` via Passport — a `JwtStrategy` já popula `request.user.role`.
O `RolesGuard` lê esse campo. **Não adicionar JwtExtractGuard aqui.**

- [ ] **Step 3: Adicionar @Roles nos endpoints do UsersController**

O `UserRole` já é exportado por `./dto/provision-user.dto`. Atualizar o controller:

```typescript
import { Controller, Post, Body, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { ProvisionUserDto, UserRole } from './dto/provision-user.dto';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('provision')
  async provision(@Body() provisionUserDto: ProvisionUserDto) {
    return this.usersService.provision(provisionUserDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)
  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
```

- [ ] **Step 4: Rodar os testes do ms-identity**

```bash
cd apps/ms-identity && npm test -- --passWithNoTests
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/ms-identity/src/app.module.ts \
        apps/ms-identity/src/users/users.controller.ts \
        apps/ms-identity/src/common/guards/roles.guard.ts \
        apps/ms-identity/src/common/decorators/roles.decorator.ts
git commit -m "fix(ms-identity): add RolesGuard globally and restrict provision/findByEmail endpoints (A1, A2)"
```

---

## Task 2 — Remover accessToken do body de `/auth/token` e ajustar frontend (M2)

**Contexto:** `GET /auth/token` reflete o valor do cookie HttpOnly no body JSON, permitindo que JS leia o token. Tanto `LoginSuccess.tsx` quanto `App.tsx` usam `data.accessToken` dessa resposta.

**Fix:** Backend retorna apenas `user` (sem `accessToken`). Frontend usa `POST /auth/refresh` para obter o token — já é usado para renovação em 401. O payload JWT (decodificado sem verificação, pois veio do servidor) contém todos os dados necessários.

**Arquivos:**
- Modificar: `apps/ms-identity/src/auth/auth.controller.ts`
- Modificar: `apps/frontend/src/lib/api.ts`
- Modificar: `apps/frontend/src/pages/LoginSuccess.tsx`
- Modificar: `apps/frontend/src/App.tsx`

- [ ] **Step 1: Remover accessToken do retorno de getToken() no backend**

Em `apps/ms-identity/src/auth/auth.controller.ts`, alterar o método `getToken`:

```typescript
// ANTES:
@Get('token')
@UseGuards(AuthGuard('jwt'))
getToken(@Req() req: any, @Res() res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  const accessToken = req.cookies?.[ACCESS_COOKIE];
  return res.json({ accessToken, user: req.user });
}

// DEPOIS:
@Get('token')
@UseGuards(AuthGuard('jwt'))
getToken(@Req() req: any, @Res() res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  return res.json({ user: req.user });
}
```

- [ ] **Step 2: Adicionar helper decodeJwtPayload em api.ts**

Adicionar após os imports em `apps/frontend/src/lib/api.ts`:

```typescript
/** Decode JWT payload without verification (safe — token came from our own server). */
export function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}
```

- [ ] **Step 3: Atualizar LoginSuccess.tsx para usar /auth/refresh**

`POST /auth/refresh` retorna `{ ok: true, accessToken }` e rotaciona o refresh token. O payload JWT contém `{ sub, email, role, tenants }`:

```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { decodeJwtPayload } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginSuccess: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // M2: use POST /auth/refresh instead of GET /auth/token to avoid reflecting
    // the HttpOnly cookie value into a readable response body.
    fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Authentication failed');
        return res.json();
      })
      .then(({ accessToken }) => {
        const payload = decodeJwtPayload(accessToken);
        setAuth(accessToken, {
          id: payload.sub,
          email: payload.email,
          name: payload.email,
          role: payload.role,
          tenants: payload.tenants,
        });

        if (payload.tenants?.length > 0) {
          const t = payload.tenants[0];
          useTenantStore.getState().setCurrentTenant({
            id: t.schoolId,
            name: t.schoolName || t.schoolId,
            schema: t.schema,
          });
          useAuthStore.getState().setEscolaSelecionada(t.schoolId);
        }

        navigate('/');
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default LoginSuccess;
```

- [ ] **Step 4: Atualizar App.tsx para usar /auth/refresh na restauração de sessão**

Localizar o `useEffect` de restauração (linhas ~80-99). Adicionar import de `decodeJwtPayload` no topo:

```typescript
import { decodeJwtPayload } from './lib/api';
```

Alterar o useEffect:

```typescript
useEffect(() => {
  const { user, token, setAuth, clearAuth } = useAuthStore.getState();
  if (user && !token) {
    fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(({ accessToken }) => {
        const payload = decodeJwtPayload(accessToken);
        setAuth(accessToken, {
          id: payload.sub,
          email: payload.email,
          name: payload.email || user.name,
          role: payload.role,
          tenants: payload.tenants,
        });
      })
      .catch(() => clearAuth())
      .finally(() => setIsRestoringSession(false));
  }
}, []);
```

- [ ] **Step 5: Rodar o build do frontend para verificar tipos**

```bash
cd apps/frontend && npm run build
```

Expected: build sem erros

- [ ] **Step 6: Commit**

```bash
git add apps/ms-identity/src/auth/auth.controller.ts \
        apps/frontend/src/pages/LoginSuccess.tsx \
        apps/frontend/src/App.tsx \
        apps/frontend/src/lib/api.ts
git commit -m "fix(auth): remove access token from /auth/token response body; frontend uses /auth/refresh for session init (M2)"
```

---

## Task 3 — Remover `login()` dead code e corrigir `findByIds` deprecado (M1 + M4)

**Arquivo:** `apps/ms-identity/src/auth/auth.service.ts`

- [ ] **Step 1: Remover o método login() e corrigir findByIds**

1. Remover completamente o método `login()` (linhas 86-107)
2. O arquivo tem `import { Repository } from 'typeorm'` na linha 4. Alterar para:
   ```typescript
   import { Repository, In } from 'typeorm';
   ```
3. Substituir `findByIds` na linha ~47:
   ```typescript
   // ANTES:
   const schools = schoolIds.length > 0
     ? await this.schoolsRepository.findByIds(schoolIds)
     : [];

   // DEPOIS:
   const schools = schoolIds.length > 0
     ? await this.schoolsRepository.findBy({ id: In(schoolIds) })
     : [];
   ```

- [ ] **Step 2: Rodar os testes**

```bash
cd apps/ms-identity && npm test
```

Expected: PASS — nenhum teste chama `login()`

- [ ] **Step 3: Commit**

```bash
git add apps/ms-identity/src/auth/auth.service.ts
git commit -m "fix(ms-identity): remove dead login() method and replace deprecated findByIds with findBy+In (M1, M4)"
```

---

## Task 4 — Logar erros Redis em vez de silenciar (M3)

**Arquivo:** `apps/ms-identity/src/auth/refresh-token.service.ts`

- [ ] **Step 1: Adicionar Logger e substituir handler vazio**

O import atual é `import { Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common'`.

1. Adicionar `Logger`: `import { Injectable, Logger, OnModuleDestroy, UnauthorizedException } from '@nestjs/common'`
2. Adicionar como campo privado na classe: `private readonly logger = new Logger(RefreshTokenService.name);`
3. Substituir o handler de erro na linha 24:
   ```typescript
   // ANTES:
   this.redis.on('error', () => {});

   // DEPOIS:
   this.redis.on('error', (err: Error) =>
     this.logger.warn(`Redis error: ${err.message}`)
   );
   ```

- [ ] **Step 2: Rodar testes**

```bash
cd apps/ms-identity && npm test
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/ms-identity/src/auth/refresh-token.service.ts
git commit -m "fix(ms-identity): log Redis errors instead of silently swallowing them (M3)"
```

---

## Task 5 — Remover schemas PostgreSQL do localStorage (A3)

**Contexto:** `authStore.ts` persiste `user.tenants[].schema` no localStorage. O `tenantStore.ts` já mantém o schema correto em memória (não persistido). Após a Task 2, o init flow popula o schema via `/auth/refresh` + decode do JWT.

**Arquivo:** `apps/frontend/src/stores/authStore.ts`

- [ ] **Step 1: Atualizar partialize para excluir schema de tenants**

Localizar o bloco `partialize` e alterar:

```typescript
partialize: (state) => ({
  user: state.user
    ? {
        ...state.user,
        tenants: state.user.tenants?.map(({ id, name }) => ({ id, name })),
      }
    : null,
  role: state.role,
  unidadeAtual: state.unidadeAtual,
}),
```

- [ ] **Step 2: Rodar o build**

```bash
cd apps/frontend && npm run build
```

Expected: build sem erros de tipo

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/stores/authStore.ts
git commit -m "fix(frontend): exclude PostgreSQL schema names from localStorage persistence (A3)"
```

---

## Task 6 — Remover verificação dupla de JWT no TenantInterceptor (B2)

**Contexto:** O interceptor verifica o JWT e sobrescreve `request.user`, apagando o campo `userId` do guard. Após a remoção do bloco JWT, o `ConfigService` também pode ser removido do interceptor (só era usado ali).

**Arquivos:** `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`, e os de ms-hr e ms-finance (idênticos).

- [ ] **Step 1: Remover o bloco JWT e imports desnecessários (ms-academic)**

Em `apps/ms-academic/src/common/interceptors/tenant.interceptor.ts`:

1. Remover o bloco das linhas ~35-53 (verificação do `authHeader`, `jwt.verify`, `request.user = decoded`)
2. Remover `import * as jwt from 'jsonwebtoken'`
3. Remover `ConfigService` do import de `@nestjs/config` e do constructor
   — ele só era usado no bloco removido
4. Manter `UnauthorizedException` — ainda é usado em `throw new UnauthorizedException('Authentication required for tenant context')`

O constructor simplificado fica:
```typescript
constructor(private dataSource: DataSource) {}
```

O método `intercept` deve começar direto em:
```typescript
const request = context.switchToHttp().getRequest();
const user = request.user;
const headerTenant = request.headers['x-tenant-id'];
```

- [ ] **Step 2: Aplicar o mesmo fix em ms-hr e ms-finance**

```bash
diff apps/ms-academic/src/common/interceptors/tenant.interceptor.ts \
     apps/ms-hr/src/common/interceptors/tenant.interceptor.ts
```

Aplicar as mesmas remoções. Repetir para ms-finance.

- [ ] **Step 3: Rodar os testes**

```bash
cd apps/ms-academic && npm test
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/ms-academic/src/common/interceptors/tenant.interceptor.ts \
        apps/ms-hr/src/common/interceptors/tenant.interceptor.ts \
        apps/ms-finance/src/common/interceptors/tenant.interceptor.ts
git commit -m "fix(interceptors): remove redundant JWT verification from TenantInterceptor, trust JwtExtractGuard (B2)"
```

---

## Task 7 — Implementar assignToClass de verdade (B1)

**Contexto:** `StudentsService.assignToClass()` ignora `classId` e não persiste associação. A tabela `student_classes` já existe via `@JoinTable` na entidade `Student`.

**Arquivos:**
- Modificar: `apps/ms-academic/src/students/students.service.ts`
- Modificar: `apps/ms-academic/src/students/students.controller.ts`
- Modificar: `apps/ms-academic/src/students/students.service.spec.ts`

- [ ] **Step 1: Escrever testes falhando para o novo comportamento**

Substituir o bloco `describe('assignToClass', ...)` existente (linhas 149-161) pelo novo:

```typescript
describe('assignToClass', () => {
  it('should add the class to student.classes and persist', async () => {
    const mockClass = { id: 'cls-1', name: 'Turma A' };
    const studentWithClass = { ...mockStudent, classes: [mockClass] };

    // Sequência de findOne: student → class → student (retorno final)
    mockRepo.findOne
      .mockResolvedValueOnce(mockStudent)
      .mockResolvedValueOnce(mockClass)
      .mockResolvedValueOnce(studentWithClass);
    mockRepo.save.mockResolvedValue(studentWithClass);

    const result = await service.assignToClass('stu-1', 'cls-1');

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.classes).toContainEqual(mockClass);
  });

  it('should throw NotFoundException if student does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.assignToClass('bad-id', 'cls-1')).rejects.toThrow(
      'Student with ID bad-id not found',
    );
  });

  it('should throw NotFoundException if class does not exist', async () => {
    mockRepo.findOne
      .mockResolvedValueOnce(mockStudent)
      .mockResolvedValueOnce(null);
    await expect(service.assignToClass('stu-1', 'bad-cls')).rejects.toThrow(
      'Class with ID bad-cls not found',
    );
  });

  it('should not save if student is already enrolled in the class', async () => {
    const mockClass = { id: 'cls-1', name: 'Turma A' };
    const enrolled = { ...mockStudent, classes: [mockClass] };
    mockRepo.findOne
      .mockResolvedValueOnce(enrolled)
      .mockResolvedValueOnce(mockClass)
      .mockResolvedValueOnce(enrolled);

    const result = await service.assignToClass('stu-1', 'cls-1');

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(result.classes).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
cd apps/ms-academic && npm test -- --testPathPattern="students.service"
```

Expected: FAIL

- [ ] **Step 3: Implementar assignToClass**

```typescript
// Adicionar import de Class no topo:
import { Class } from '../classes/entities/class.entity';

// Substituir o método stub:
async assignToClass(studentId: string, classId: string): Promise<Student> {
  const repo = this.tenantRepo.getRepository(Student);
  const classRepo = this.tenantRepo.getRepository(Class);

  const student = await this.findOne(studentId);

  const targetClass = await classRepo.findOne({ where: { id: classId } });
  if (!targetClass) {
    throw new NotFoundException(`Class with ID ${classId} not found`);
  }

  if (!student.classes) {
    student.classes = [];
  }

  const alreadyAssigned = student.classes.some((c) => c.id === classId);
  if (!alreadyAssigned) {
    student.classes.push(targetClass);
    await repo.save(student);
  }

  return this.findOne(studentId);
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

```bash
cd apps/ms-academic && npm test -- --testPathPattern="students.service"
```

Expected: PASS

- [ ] **Step 5: Adicionar rota no StudentsController**

```typescript
// Adicionar após o método remove():
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)
@Post(':id/classes/:classId')
@ApiOperation({ summary: 'Assign a student to a class' })
assignToClass(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('classId', ParseUUIDPipe) classId: string,
) {
  return this.studentsService.assignToClass(id, classId);
}
```

Verificar se `ParseUUIDPipe` já está no import de `@nestjs/common` do controller — se não, adicionar.

- [ ] **Step 6: Rodar todos os testes do ms-academic**

```bash
cd apps/ms-academic && npm test
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/ms-academic/src/students/students.service.ts \
        apps/ms-academic/src/students/students.controller.ts \
        apps/ms-academic/src/students/students.service.spec.ts
git commit -m "feat(ms-academic): implement assignToClass with real persistence and POST /:id/classes/:classId route (B1)"
```

---

## Task 8 — Adicionar proteção de tamanho ao domainData (B3)

**Arquivos:**
- Criar: `apps/ms-identity/src/common/validators/max-object-size.validator.ts`
- Modificar: `apps/ms-identity/src/users/dto/provision-user.dto.ts`

- [ ] **Step 1: Criar o validator customizado**

```typescript
// apps/ms-identity/src/common/validators/max-object-size.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxObjectSize', async: false })
export class MaxObjectSizeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    return JSON.stringify(value).length <= 4096;
  }

  defaultMessage(): string {
    return 'domainData must not exceed 4KB when serialized';
  }
}

export function MaxObjectSize(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: MaxObjectSizeConstraint,
    });
  };
}
```

- [ ] **Step 2: Aplicar o decorator no DTO**

```typescript
// Adicionar ao import existente em provision-user.dto.ts:
import { MaxObjectSize } from '../../common/validators/max-object-size.validator';

// No campo domainData:
@IsObject()
@IsNotEmpty()
@MaxObjectSize()
domainData: Record<string, any>;
```

- [ ] **Step 3: Rodar os testes**

```bash
cd apps/ms-identity && npm test
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/ms-identity/src/users/dto/provision-user.dto.ts \
        apps/ms-identity/src/common/validators/max-object-size.validator.ts
git commit -m "fix(ms-identity): add 4KB size limit validator to domainData in ProvisionUserDto (B3)"
```

---

## Verificação Final

```bash
# Da raiz do monorepo:
npm run test
```

Expected: todos os workspaces passam sem erros.

---

## Ordem de Execução Recomendada

1. **Task 1** (A1+A2) — escalada de privilégios, maior risco
2. **Task 2** (M2) — fix de init flow + remoção do leak de token (depende de Task 1 para não quebrar login)
3. **Task 5** (A3) — remover schemas do localStorage (complementa Task 2)
4. **Task 3** (M1+M4) — remoção de dead code + API deprecated
5. **Task 4** (M3) — observabilidade do Redis
6. **Task 6** (B2) — eliminação de redundância
7. **Task 7** (B1) — funcionalidade incompleta
8. **Task 8** (B3) — proteção adicional de input
