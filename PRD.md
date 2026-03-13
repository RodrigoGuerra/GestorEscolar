# Product Requirements Document (PRD) - Sistema de Gestão Escolar Multi-Tenant

## 1. Visão Geral e Objetivo
Sistema SaaS para gestão de redes escolares (Franquias). O sistema permite que uma escola Matriz gerencie múltiplas Filiais, centralizando disciplinas e balanços financeiros, mas distribuindo a gestão de turmas, alunos e professores.
**Stack Tecnológico:** NestJS (Backend), React (Frontend), PostgreSQL (DB Principal), Redis (Cache), RabbitMQ (Mensageria), Kong (API Gateway). Todas as APIs devem expor documentação Swagger.

## 2. Arquitetura Multi-Tenant (CRÍTICO PARA O BANCO DE DADOS)
A aplicação usa a estratégia **"Schema-per-Franchise"** no PostgreSQL. 
* **Schema `public`:** Contém apenas dados globais de acesso. 
  * Tabelas: `users` (dados vindos do Google) e `tenant_mappings` (relaciona o user_id ao schema da franquia que ele tem acesso).
* **Schemas de Franquias (ex: `franchise_xyz`):** Cada rede de escolas tem seu próprio schema.
  * Todas as operações do sistema (Core, RH, Financeiro) ocorrem *dentro* deste schema dinâmico.
  * **Isolamento Matriz vs Filial:** Dentro do schema da franquia, as tabelas terão a coluna `school_id`. Isso separa os dados da Matriz dos dados de cada Filial.
* **Mecanismo de Troca (Backend):** O `ms-identity` gera um JWT contendo o `franchise_schema` e o `school_id`. Os outros microsserviços possuem um Interceptor que lê o JWT e executa `SET search_path TO franchise_xyz` no Postgres antes de qualquer query.

## 3. Matriz de Perfis e Permissões (RBAC)
Todo usuário possui uma `role` que define seu nível de acesso:
1. **Gerente (Manager):** Acesso total. Pode criar filiais, ver o balanço consolidado de todas as escolas da franquia, inativar alunos e gerir o RH.
2. **Administrador (Admin):** Gestor da Filial. Cria turmas, aloca professores, verifica adimplência local e cadastra horários.
3. **Professor (Teacher):** Acesso restrito às suas próprias turmas. Pode bater ponto, visualizar seus pagamentos, lançar notas, registrar presenças e fazer upload de material. *Nota: Se leciona em mais de uma filial, o JWT deve conter a lista de acessos, mas o login é único.*
4. **Aluno/Responsável (Student):** Visualiza boletim em tempo real, materiais de aula, boletos futuros e histórico de pagamentos (com exportação de recibo).

## 4. Dicionário de Domínios e Modelagem de Dados Base

### 4.1. `ms-identity` (Autenticação Global)
* **Auth Fluxo:** Exclusivo via Google OAuth 2.0. Não existem senhas na base.
* **Entidade `User` (Schema public):** `id`, `email`, `google_id`, `name`, `created_at`.
* **Entidade `TenantMapping` (Schema public):** `id`, `user_id`, `franchise_schema`, `school_id`, `role`.

### 4.2. `ms-academic` (Core Escolar - Dentro do Schema da Franquia)
* **Entidade `School`:** `id`, `name`, `cnpj`, `is_matrix` (boolean), `parent_school_id` (nulo se for matriz). Filiais são folhas (não podem ter subescolas).
* **Entidade `Subject` (Disciplina):** `id`, `name`, `workload` (carga horária), `syllabus` (ementa), `matrix_id`. *Regra: Apenas a Matriz cria disciplinas. Filiais apenas as consomem.*
* **Entidade `Class` (Turma):** `id`, `school_id`, `name` (ex: 6º Ano Informática), `year`.
* **Entidade `ClassSchedule` (Grade/Horário):** `id`, `class_id`, `subject_id`, `teacher_id`, `day_of_week`, `start_time`, `end_time`.
* **Entidade `Grade` (Nota):** `id`, `student_id`, `class_id`, `subject_id`, `score`, `term` (bimestre/semestre).

### 4.3. `ms-hr` (Recursos Humanos)
* **Entidade `Employee`:** `id`, `school_id`, `user_id`, `cpf`, `position` (Professor, Limpeza, etc.), `hourly_rate` (valor hora).
* **Entidade `BankDetails`:** `id`, `employee_id`, `bank_code`, `agency`, `account`, `pix_key`.
* **Entidade `TimeRecord` (Ponto):** `id`, `employee_id`, `date`, `clock_in`, `clock_out`. *Regra: Usado para cálculo da folha de pagamento baseada na carga horária.*

### 4.4. `ms-finance` (Financeiro)
* **Entidade `Invoice` (Mensalidade/Boleto):** `id`, `school_id`, `student_id`, `amount`, `due_date`, `status` (PENDING, PAID, OVERDUE), `payment_date`.
* **Entidade `Transaction` (Auditoria/Ledger):** Tabela append-only para registro imutável de entradas (pagamento de alunos) e saídas (pagamento de professores).
* **Regras de Negócio:**
  * O Gerente da Matriz pode consultar um `GROUP BY` na tabela `Transaction` usando o `school_id` para ver o balanço de todas as filiais.
  * O sistema roda um CronJob diário para buscar `Invoices` com `due_date` < hoje e `status = PENDING`, mudando para `OVERDUE`.

## 5. Catálogo de Eventos (RabbitMQ)
A comunicação assíncrona deve seguir este padrão de mensageria:
* **Exchange:** `school.events` (Topic)
* **Eventos Esperados:**
  * `student.overdue`: Disparado pelo `ms-finance` no CronJob diário. Payload: `{ student_id, school_id, invoice_id, days_late }`.
  * `payment.received`: Disparado quando um gateway confirma pagamento. Payload: `{ invoice_id, amount, student_id }`.

## 6. Diretrizes de Código para a IA
* Utilize **DTOs** com `class-validator` e `class-transformer` em todos os endpoints NestJS.
* Utilize **Exception Filters** globais para padronizar as respostas de erro HTTP.
* Todo serviço deve ter um arquivo `.env.example` claro.
* O Frontend React deve usar **Zustand** para gerenciar o estado do usuário logado e o token JWT.