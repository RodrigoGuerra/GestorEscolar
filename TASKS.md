# Plano de Execução Detalhado - Gestão Escolar Multi-Tenant

> **Instrução Global para a IA:** Ao executar as tarefas abaixo, NUNCA comite diretamente na branch `main`. Crie uma branch `feature/<nome-da-task>`, desenvolva, escreva os testes básicos, faça o commit, faça o push e exiba o comando para abrir o Pull Request. Aguarde a aprovação humana antes de prosseguir para a próxima task. Use o NestJS CLI para gerar os recursos (`nest g res ...`).

## Fase 0: Setup Inicial e Versionamento
- [ ] **Task 0.1:** Inicializar o repositório Git local. 
- [ ] **Task 0.2:** Criar o arquivo `.gitignore` focado em ecossistema Node, React e arquivos de ambiente (`.env`).
- [ ] **Task 0.3:** Inicializar o projeto como um Monorepo usando **Turborepo** ou **Nx** (com workspaces do npm/pnpm).
- [ ] **Task 0.4:** Fazer o commit inicial na `main` contendo apenas a estrutura do monorepo, `PRD.md` e `TASKS.md`.
- [ ] **Task 0.5:** Criar e mudar para a branch `develop`.

## Fase 1: Infraestrutura Base (Docker)
- [ ] **Task 1.1:** Criar branch `feature/infra-docker`.
- [ ] **Task 1.2:** Na raiz do projeto, criar o arquivo `docker-compose.yml`.
- [ ] **Task 1.3:** Adicionar o serviço `postgres` (versão 16-alpine), expondo a porta 5432, com volume nomeado para persistência.
- [ ] **Task 1.4:** Adicionar o serviço `redis` (versão 7-alpine), expondo a porta 6379.
- [ ] **Task 1.5:** Adicionar o serviço `rabbitmq` (versão 3-management-alpine), expondo portas 5672 e 15672.
- [ ] **Task 1.6:** Adicionar os serviços `prometheus` e `grafana`, mapeando portas 9090 e 3000.
- [ ] **Task 1.7:** Subir os containers localmente e validar se estão saudáveis. Comitar e solicitar PR para `develop`.

## Fase 2: Kong API Gateway
- [ ] **Task 2.1:** Criar branch `feature/kong-gateway`.
- [ ] **Task 2.2:** Adicionar o Kong (DB-less mode) no `docker-compose.yml`.
- [ ] **Task 2.3:** Criar arquivo `kong.yml` configurando os `services` e `routes` iniciais (ex: rotas apontando para o futuro `ms-identity` e `ms-academic`).
- [ ] **Task 2.4:** Comitar e solicitar PR para `develop`.

## Fase 3: Microsserviço de Identidade (`ms-identity`)
- [ ] **Task 3.1:** Criar branch `feature/ms-identity-base`.
- [ ] **Task 3.2:** Dentro do monorepo, gerar um novo app NestJS chamado `ms-identity`.
- [ ] **Task 3.3:** Configurar TypeORM (ou Prisma) neste app para conectar ao banco de dados no schema `public`.
- [ ] **Task 3.4:** Criar a entidade `User` (id, email, name, role, created_at).
- [ ] **Task 3.5:** Criar a entidade `FranchiseTenant` (id, user_id, franchise_schema_name, school_id). Relacionar com `User`. Executar migration.
- [ ] **Task 3.6:** Criar branch `feature/ms-identity-auth`.
- [ ] **Task 3.7:** Instalar dependências do Passport.js (`@nestjs/passport`, `passport-google-oauth20`, `@nestjs/jwt`).
- [ ] **Task 3.8:** Implementar a estratégia do Google. O serviço deve buscar o email no banco; se não existir, cria o usuário.
- [ ] **Task 3.9:** Implementar a geração do Token JWT contendo no payload: `sub` (user_id), `email`, `role`, e a lista de `franchise_schemas` aos quais ele tem acesso. Comitar e solicitar PR.

## Fase 4: Core Acadêmico (`ms-academic`) e Multi-Tenancy
- [ ] **Task 4.1:** Criar branch `feature/ms-academic-base`.
- [ ] **Task 4.2:** Gerar o app NestJS `ms-academic`.
- [ ] **Task 4.3:** **(Crítico)** Implementar um Middleware/Interceptor que lê o Token JWT do header, extrai o `franchise_schema`, e injeta essa informação no provedor de banco de dados (setando dinamicamente o `search_path` do Postgres para a requisição atual).
- [ ] **Task 4.4:** Criar branch `feature/academic-schools`.
- [ ] **Task 4.5:** Criar Entidade `School` (id, name, is_matrix, parent_school_id). Apenas a Matriz tem `is_matrix=true`.
- [ ] **Task 4.6:** Criar CRUD completo para `School` com DTOs usando `class-validator`. Comitar e solicitar PR.
- [ ] **Task 4.7:** Criar branch `feature/academic-subjects`.
- [ ] **Task 4.8:** Criar Entidade `Subject` (id, name, workload, syllabus, matrix_id). Criar endpoints garantindo que só a matriz cadastra disciplinas, mas filiais podem listá-las.
- [ ] **Task 4.9:** Criar Entidades `Class` (Turma) e `ClassSchedule` (Grade horária). Relacionar Turmas com a Escola (Filial) e as Disciplinas. Comitar e solicitar PR.

## Fase 5: Recursos Humanos (`ms-hr`)
- [ ] **Task 5.1:** Criar branch `feature/ms-hr-base`.
- [ ] **Task 5.2:** Gerar o app NestJS `ms-hr`. Configurar o interceptor Multi-tenant (mesmo da Fase 4).
- [ ] **Task 5.3:** Criar Entidade `Employee` (dados pessoais, role) e `BankDetails`.
- [ ] **Task 5.4:** Criar Entidade `TimeRecord` para o ponto eletrônico (employee_id, clock_in, clock_out, date).
- [ ] **Task 5.5:** Implementar endpoint para bater ponto (`POST /hr/time-record/punch`). Comitar e solicitar PR.

## Fase 6: Financeiro e Mensageria (`ms-finance` & `ms-notification`)
- [ ] **Task 6.1:** Criar branch `feature/ms-finance-base`.
- [ ] **Task 6.2:** Gerar app `ms-finance`. Configurar banco (Multi-tenant) e conectar ao RabbitMQ usando o `@nestjs/microservices`.
- [ ] **Task 6.3:** Criar Entidade `Invoice` (id, student_id, amount, due_date, status ['PENDING', 'PAID', 'OVERDUE']).
- [ ] **Task 6.4:** Criar um CronJob usando `@nestjs/schedule` que roda diariamente à meia-noite, busca faturas vencidas e atualiza o status para `OVERDUE`.
- [ ] **Task 6.5:** Na mesma rotina do CronJob, para cada fatura vencida, emitir no RabbitMQ o evento: `{"pattern": "student.overdue", "data": { "student_id": "...", "franchise_schema": "..." }}`. Comitar e solicitar PR.
- [ ] **Task 6.6:** Criar branch `feature/ms-notification-base`.
- [ ] **Task 6.7:** Gerar app `ms-notification`. Configurar exclusivamente como consumidor do RabbitMQ.
- [ ] **Task 6.8:** Criar o handler `@EventPattern('student.overdue')` que loga a informação ou dispara um alerta (mock de email/webhook). Comitar e solicitar PR.

## Fase 7: Frontend (React)
- [ ] **Task 7.1:** Criar branch `feature/frontend-base`.
- [ ] **Task 7.2:** Dentro do monorepo, gerar um app React (Next.js ou Vite + React).
- [ ] **Task 7.3:** Configurar TailwindCSS e Zustand (para gerenciamento de estado global).
- [ ] **Task 7.4:** Criar a tela de Login contendo o botão "Login com Google".
- [ ] **Task 7.5:** Integrar o fluxo OAuth com o Gateway/`ms-identity` e salvar o JWT retornado no localStorage/cookies.
- [ ] **Task 7.6:** Criar a tela de seleção de Franquia (caso o usuário pertença a mais de uma). Comitar e solicitar PR.
- [ ] **Task 7.7:** Criar branch `feature/frontend-dashboards`. Criar layout base (Sidebar, Header) dependendo da `role` do usuário (Gerente vê um menu, Professor vê outro). Comitar e solicitar PR.