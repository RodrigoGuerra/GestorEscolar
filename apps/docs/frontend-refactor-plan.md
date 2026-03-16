# PRD: Refatoração de Fluxo e UI do Frontend Escolar

## 1. Diretrizes para a Inteligência Artificial (LEIA ANTES DE CODAR)
* **REGRA 01 (Sem Alucinações de Backend):** Você está atuando APENAS no Frontend. NENHUMA alteração deve ser feita nas APIs, no banco de dados ou no backend. Assuma que os endpoints necessários já existem ou solicite o contrato do endpoint ao usuário.
* **REGRA 02 (Stack Tecnológica Rigorosa):**
  * Framework: [EX: React com Vite OU Next.js App Router]
  * Estilização: [EX: Tailwind CSS OU Material UI OU Styled Components]
  * Gerenciamento de Estado: [EX: Zustand OU Redux OU React Context]
  * Roteamento: [EX: React Router Dom v6]
  * Fetch de Dados: [EX: Axios + React Query OU Fetch nativo]
* **REGRA 03 (Estrutura de Pastas):** Respeite a seguinte estrutura. Não crie pastas fora deste padrão:
  * `src/components/`: Componentes reutilizáveis (Botões, Inputs, Tabelas).
  * `src/layout/`: Componentes de estrutura de tela (Sidebar, Header).
  * `src/pages/` (ou `src/views/`): Telas principais associadas às rotas.
  * `src/store/` (ou `src/context/`): Gerenciamento de estado global.
  * `src/routes/`: Configuração de roteamento e guards.

## 2. Objetivo
Implementar um sistema de roteamento baseado em papéis (RBAC - Role-Based Access Control) e refatorar a interface para suportar um ecossistema Multi-tenant (Matriz e Filiais).

## 3. Gestão de Estado Global Necessária
O frontend precisa armazenar as seguintes informações ativas na sessão:
1. `user`: Objeto com dados do usuário logado.
2. `role`: O papel do usuário logado. Valores permitidos: `GESTOR`, `FUNCIONARIO`, `ALUNO`.
3. `unidadeAtual`: ID da escola que o usuário está visualizando no momento (Matriz ou Filial). Por padrão, no login, deve ser a Matriz.

## 4. Matriz de Acesso (RBAC) e Comportamento do Sidebar (Treeview)

### 4.1. Perfil GESTOR
* **Pouso pós-login:** `/matriz` (Exibindo o layout global).
* **Itens do Sidebar permitidos:**
  1. `Dashboard` (Métricas da matriz e filiais, drilldown).
  2. `Disciplina` (CRUD disciplinas).
  3. `Acadêmico` (CRUD unidades escolares).
  4. `Colaboradores` (CRUD funcionários globais).
  5. `Financeiro` (Balanço e fluxo de caixa).
  6. `Escola` (Redireciona para o seletor de unidades).

### 4.2. Perfil FUNCIONÁRIO
* **Pouso pós-login:** `/matriz` (Aviso: A matriz é apenas um ponto de entrada, as ações reais ocorrem na unidade selecionada).
* **Itens do Sidebar permitidos:**
  1. `Escola` (Redireciona para o seletor de unidades que ele atua).

### 4.3. Perfil ALUNO
* **Pouso pós-login:** `/matriz`
* **Itens do Sidebar permitidos:**
  1. `Escola` (Redireciona para o seletor de unidades em que está matriculado).

## 5. Fluxo Específico do Módulo "Escola" (Visão Local)
Quando qualquer usuário clica no menu "Escola", ele deve ver uma lista de unidades disponíveis para ele. Ao selecionar uma escola (ex: id 123), a rota muda para `/escola/123/dashboard` e o conteúdo muda conforme o papel:
* **Gestor:** Vê abas/menus para: Gerenciar Alunos, Montar Turmas, Cronograma.
* **Funcionário:** Vê abas/menus para: Minhas Turmas (Inserir Material, Lançar Notas, Lançar Presença) e Bater Ponto.
* **Aluno:** Vê abas/menus para: Minhas Turmas (Visualizar Material, Ver Notas, Ver Presença).