# Relatório de Revisão de Código — GestorEscolar

**Data:** 2026-03-18
**Escopo:** Revisão completa do monorepo (ms-identity, ms-academic, ms-hr, ms-finance, frontend)
**Metodologia:** Análise estática por leitura de código-fonte, organizada por severidade

---

## Definição de Severidades

| Nível | Critério |
|-------|----------|
| **Crítico** | Vulnerabilidade de segurança explorável ou risco de perda de dados imediata |
| **Alto** | Bug funcional que quebra comportamento esperado OU brecha de autorização |
| **Médio** | Código incorreto ou inseguro com impacto moderado em produção |
| **Baixo** | Qualidade de código, comentários enganosos, inconsistências sem impacto imediato |

---

## Findings

### 🔴 Crítico

Nenhum item crítico identificado. O projeto possui proteções sólidas para as principais superfícies de ataque:
- SQL injection via `search_path`: bloqueado por regex + verificação em `pg_namespace`
- JWT forjado: verificado por assinatura em todos os microsserviços
- Tenant hopping: schema verificado contra lista autorizada no JWT
- Refresh token race condition: resolvida com GETDEL atômico

---

### 🟠 Alto

#### A1 — `POST /api/v1/users/provision` sem restrição de papel

**Arquivo:** [`apps/ms-identity/src/users/users.controller.ts:12-15`](apps/ms-identity/src/users/users.controller.ts#L12-L15)

**Problema:**
```typescript
@UseGuards(AuthGuard('jwt'))  // ← apenas autenticação, sem papel
@Controller('api/v1/users')
export class UsersController {
  @Post('provision')
  async provision(@Body() provisionUserDto: ProvisionUserDto) {
    return this.usersService.provision(provisionUserDto);
  }
```
O endpoint de provisionamento de novos usuários exige apenas autenticação JWT. Não há `@Roles()` — qualquer usuário com papel `STUDENT` ou `EMPLOYEE` pode criar novos usuários em qualquer tenant schema.

**Impacto:** Escalada de privilégios: um aluno autenticado pode provisionar contas com papel `ADMIN` ou `MANAGER`, comprometendo todo o controle de acesso do sistema.

**Sugestão:** Adicionar `@Roles(UserRole.ADMIN, UserRole.MANAGER)` ao endpoint `provision` e garantir que o `RolesGuard` esteja na cadeia de guards do `ms-identity`.

---

#### A2 — `GET /api/v1/users/:email` sem restrição de papel

**Arquivo:** [`apps/ms-identity/src/users/users.controller.ts:17-24`](apps/ms-identity/src/users/users.controller.ts#L17-L24)

**Problema:**
```typescript
@Get(':email')
async findByEmail(@Param('email') email: string) {
  const user = await this.usersService.findByEmail(email);
  // ...
  return user;  // retorna entidade User completa, incluindo googleId
}
```
Qualquer usuário autenticado — inclusive com papel `STUDENT` ou `EMPLOYEE` — pode consultar dados de qualquer outro usuário pelo e-mail, recebendo o objeto `User` completo incluindo `googleId`, `role` e `createdAt`.

**Impacto:** Quebra do princípio de menor privilégio. Um aluno pode enumerar perfis de outros usuários do sistema.

**Sugestão:** Adicionar `@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)` ao endpoint, ou criar um DTO de resposta que projete apenas os campos necessários para cada papel.

---

#### A3 — Schemas internos do PostgreSQL persistidos no localStorage

**Arquivos:**
- [`apps/frontend/src/stores/authStore.ts:55-59`](apps/frontend/src/stores/authStore.ts#L55-L59)
- [`apps/frontend/src/lib/api.ts:19-22`](apps/frontend/src/lib/api.ts#L19-L22)

**Problema:**
O `partialize` do Zustand exclui o `token` do localStorage, mas **inclui o objeto `user` completo**, que contém `user.tenants[].schema` — os nomes internos dos schemas PostgreSQL por tenant.

```typescript
partialize: (state) => ({
  user: state.user,   // ← user.tenants[].schema está aqui
  role: state.role,
  unidadeAtual: state.unidadeAtual,
}),
```

O comentário em `api.ts` descreve corretamente que o schema é derivado do array `user.tenants` ao invés de um campo separado no localStorage. No entanto, a intenção de não expor o schema no storage é contrariada pelo `authStore.ts`, que persiste o objeto `user` completo incluindo os schemas.

**Impacto:** Um script XSS (ou extensão maliciosa) pode ler `localStorage['auth-storage']` e obter os nomes dos schemas PostgreSQL de todos os tenants do usuário, facilitando reconhecimento para ataques futuros.

**Sugestão:** Remover `schema` do objeto `tenant` antes de persistir (manter apenas `id` e `name`), e resolver o schema dinamicamente a partir do JWT (cookie HttpOnly) no momento da request. O `api.ts` já tem a infraestrutura para isso.

---

### 🟡 Médio

#### M1 — `login()` é dead code com comportamento inconsistente

**Arquivo:** [`apps/ms-identity/src/auth/auth.service.ts:86-107`](apps/ms-identity/src/auth/auth.service.ts#L86-L107)

**Problema:**
O método `login()` existe mas nunca é chamado pelo `AuthController` (que usa exclusivamente `validateOAuthUser()` no fluxo OAuth). Além disso:
1. Não emite refresh token (ao contrário de `validateOAuthUser`)
2. Retorna `{ access_token: ... }` com snake_case, divergindo do padrão camelCase do resto da API
3. Duplica a lógica de construção do payload JWT (incluindo um segundo uso de `findByIds` deprecated — ver M3)

**Impacto:** Se `login()` for conectado a um endpoint futuramente por engano, o usuário recebe access token sem refresh token — será desconectado após 15 minutos sem renovação silenciosa possível.

**Sugestão:** Remover o método `login()`. Caso haja intenção de suportar autenticação por credenciais no futuro, criar um novo método que use `refreshTokenService.create()` e retorne no mesmo formato de `validateOAuthUser`.

---

#### M2 — `GET /auth/token` reflete o access token no corpo da resposta

**Arquivo:** [`apps/ms-identity/src/auth/auth.controller.ts:83-90`](apps/ms-identity/src/auth/auth.controller.ts#L83-L90)

**Problema:**
```typescript
@Get('token')
@UseGuards(AuthGuard('jwt'))
getToken(@Req() req: any, @Res() res: Response) {
  const accessToken = req.cookies?.[ACCESS_COOKIE];
  return res.json({ accessToken, user: req.user });  // ← token no body
}
```
A intenção do design é que o access token viva apenas no cookie HttpOnly (`auth_token`), protegendo-o de XSS. Porém, este endpoint lê o cookie e reflete seu valor no corpo JSON da resposta — que JavaScript pode ler livremente.

**Impacto:** Parcialmente neutraliza a proteção XSS do cookie HttpOnly. Um script malicioso pode chamar `/auth/token` e obter o access token via `response.data.accessToken`.

**Sugestão:** Retornar apenas os dados do usuário (`user: req.user`), sem o `accessToken`. O frontend deve usar o token obtido no fluxo de refresh, não buscá-lo via este endpoint.

---

#### M3 — Erros de Redis descartados silenciosamente

**Arquivo:** [`apps/ms-identity/src/auth/refresh-token.service.ts:24`](apps/ms-identity/src/auth/refresh-token.service.ts#L24)

**Problema:**
```typescript
this.redis.on('error', () => {});
```
O handler vazio descarta **todos** os erros do Redis — incluindo falhas de conexão — por todo o ciclo de vida do serviço.

**Impacto:** Se o Redis cair em produção, operações de `refresh` e `logout` falharão silenciosamente sem registro nos logs, dificultando diagnóstico de incidentes.

**Sugestão:**
```typescript
this.redis.on('error', (err) => this.logger.warn('Redis connection error', err.message));
```

---

#### M4 — `findByIds` deprecated no TypeORM 0.3+

**Arquivo:** [`apps/ms-identity/src/auth/auth.service.ts:47`](apps/ms-identity/src/auth/auth.service.ts#L47)

**Problema:**
```typescript
const schools = schoolIds.length > 0
  ? await this.schoolsRepository.findByIds(schoolIds)
  : [];
```
`Repository.findByIds()` foi depreciado no TypeORM 0.3.x. Aparece em dois locais: linha 47 (código ativo em `validateOAuthUser`) e linha 90 (dentro do método `login()` — dead code abordado em M1).

**Impacto:** Risco de quebra em upgrades do TypeORM.

**Sugestão:**
```typescript
import { In } from 'typeorm';
// ...
const schools = schoolIds.length > 0
  ? await this.schoolsRepository.findBy({ id: In(schoolIds) })
  : [];
```

---

### 🔵 Baixo

#### B1 — `assignToClass` não é exposto como endpoint mas é código morto no serviço

**Arquivo:** [`apps/ms-academic/src/students/students.service.ts:45-47`](apps/ms-academic/src/students/students.service.ts#L45-L47)

**Problema:**
```typescript
async assignToClass(studentId: string, _classId: string): Promise<Student> {
  return this.findOne(studentId);
}
```
O método existe no serviço mas não está conectado a nenhuma rota no `StudentsController`. O parâmetro `_classId` é ignorado — nenhuma associação é persistida.

**Impacto:** Baixo no momento (sem endpoint exposto). O risco é que um desenvolvedor futuro adicione a rota assumindo que o serviço funciona corretamente.

**Sugestão:** Implementar a lógica real (persistir relação ManyToMany via `classesRepository`) ou remover o método até que o endpoint seja necessário.

---

#### B2 — Verificação dupla de JWT entre Guard e Interceptor

**Arquivos:**
- [`apps/ms-academic/src/common/guards/jwt-extract.guard.ts`](apps/ms-academic/src/common/guards/jwt-extract.guard.ts)
- [`apps/ms-academic/src/common/interceptors/tenant.interceptor.ts:35-53`](apps/ms-academic/src/common/interceptors/tenant.interceptor.ts#L35-L53)

**Problema:**
O `JwtExtractGuard` popula `request.user` com shape `{ sub, userId, email, role, tenants }`. O `TenantInterceptor` também verifica o JWT e sobrescreve `request.user = decoded` — o payload bruto do JWT, que tem `sub` mas **não tem `userId`**. O campo `userId` definido pelo guard é silenciosamente apagado.

**Impacto:** Código que depende de `request.user.userId` (setado pelo guard) receberá `undefined` após o interceptor executar. Além disso, é processamento redundante — JWT verificado duas vezes por request.

**Sugestão:** Remover a lógica de verificação JWT do `TenantInterceptor`. O interceptor deve apenas ler `request.user` que o guard já populou.

---

#### B3 — `domainData` sem validação profunda no ProvisionUserDto

**Arquivo:** [`apps/ms-identity/src/users/dto/provision-user.dto.ts:31-33`](apps/ms-identity/src/users/dto/provision-user.dto.ts#L31-L33)

**Problema:**
```typescript
@IsObject()
@IsNotEmpty()
domainData: Record<string, any>;
```
Aceita qualquer objeto JSON sem restrição de campos ou tipos.

**Impacto:** Baixo no contexto atual (campo é apenas emitido como evento RabbitMQ). Superfície de ataque aberta para expansões futuras.

**Sugestão:** Se `domainData` tem schema previsível, criar DTO aninhado com `@ValidateNested()` e `@Type()`. Se genuinamente flexível, ao menos limitar o payload com validação de tamanho customizada.

---

## Resumo

| # | Severidade | Serviço | Descrição |
|---|-----------|---------|-----------|
| A1 | 🟠 Alto | ms-identity | `POST /provision` acessível por qualquer role autenticada |
| A2 | 🟠 Alto | ms-identity | `GET /users/:email` acessível por qualquer role autenticada |
| A3 | 🟠 Alto | frontend | Schemas PostgreSQL expostos no localStorage via `user.tenants` |
| M1 | 🟡 Médio | ms-identity | `login()` é dead code com formato inconsistente |
| M2 | 🟡 Médio | ms-identity | `/auth/token` reflete access token no corpo da resposta |
| M3 | 🟡 Médio | ms-identity | Erros Redis descartados silenciosamente |
| M4 | 🟡 Médio | ms-identity | `findByIds` deprecated (TypeORM 0.3+) |
| B1 | 🔵 Baixo | ms-academic | `assignToClass` não implementado e sem rota exposta |
| B2 | 🔵 Baixo | ms-academic | JWT verificado duas vezes por request, `userId` sobrescrito |
| B3 | 🔵 Baixo | ms-identity | `domainData` sem validação profunda |

**Total: 10 findings** — 0 crítico, 3 alto, 4 médio, 3 baixo
