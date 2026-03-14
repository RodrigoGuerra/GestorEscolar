# Feature PRD: Provisionamento de Usuários e Autenticação OAuth

## 1. Visão Geral
Esta feature implementa o fluxo de onboarding no sistema Multi-Tenant. Como não utilizamos senhas (apenas Google OAuth), o ingresso no sistema exige um "Pré-cadastro" feito por um Administrador/Gerente. Este processo cria um usuário fantasma, define seus acessos (TenantMapping) e notifica os outros microsserviços via RabbitMQ. Posteriormente, o login via Google apenas "ativa" esta conta preexistente.

## 2. Atores e Casos de Uso
* **Admin/Manager (Acesso Autenticado):** Preenche o formulário de convite no frontend com E-mail, Role (Teacher, Student, Employee) e dados de domínio.
* **Novo Usuário (Acesso Não Autenticado):** Clica em "Login com Google" na tela inicial para ativar sua conta recém-criada e acessar seu schema correspondente.

## 3. Arquitetura e Fluxo de Dados

### 3.1. Fase de Pré-Cadastro (API Gateway -> ms-identity)
* O Frontend envia um POST para `/api/v1/users/provision` contendo: `email`, `role`, `school_id`, e um objeto `domain_data` (ex: cpf, cargo).
* O `ms-identity` atua no schema `public`.
* Criação na tabela `users`: Insere apenas `email`. Campos `google_id` e `name` ficam nulos.
* Criação na tabela `tenant_mappings`: Vincula o `user_id` gerado ao `franchise_schema`, `school_id` e `role`.
* **Mensageria:** O `ms-identity` publica o evento `user.provisioned` na exchange `school.events`. Payload: `{ user_id, email, role, school_id, domain_data }`.

### 3.2. Fase de Ativação (OAuth2 Login)
* O usuário finaliza o fluxo do Google OAuth2.
* O Google retorna o profile (Email, Nome, Foto, Google ID).
* O `ms-identity` busca na tabela `users` (schema `public`) pelo e-mail.
* **Regra de Negócio (Bloqueio):** Se o e-mail não existir na base, retorna HTTP 403 (Forbidden) - "Usuário não convidado pela instituição".
* **Regra de Negócio (Sucesso):** Se existir, faz um `UPDATE` preenchendo `google_id` e `name`.
* O serviço consulta o `tenant_mappings` desse `user_id`, assina um JWT com essas *claims* (franchise_schema, school_id, role) e o devolve ao frontend.

## 4. Estrutura de Banco de Dados (`ms-identity` / schema: `public`)
* **Tabela `users`:** `id` (UUID), `email` (Unique), `google_id` (Nullable, Unique), `name` (Nullable), `created_at`.
* **Tabela `tenant_mappings`:** `id` (UUID), `user_id` (FK), `franchise_schema` (String), `school_id` (UUID), `role` (Enum: MANAGER, ADMIN, TEACHER, STUDENT).