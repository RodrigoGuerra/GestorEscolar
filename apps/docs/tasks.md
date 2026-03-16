# Plano de Tarefas do Agente IA (Execução Estrita)

> **Instrução Geral para a IA:** Execute UMA TASK por vez. Após terminar uma task, pare, explique o que fez, quais arquivos alterou e aguarde o comando do usuário para prosseguir. Não tente antecipar as próximas tasks.

## ÉPICO 1: Core, Layout e Roteamento

### [x] Task 1.1: Configuração do Estado de Autenticação
* **Arquivo alvo:** `src/store/authStore.[ts/js]` ou equivalente.
* **Ação:** Criar estado global contendo: `user` (objeto), `role` (string), `escolaSelecionada` (objeto/id).
* **Regras Antialucinação:** Não crie a lógica de fetch do login, apenas a estrutura de armazenamento em memória do frontend. Exponha ações para `login(userData)` e `setEscolaSelecionada(escolaId)`.

### [x] Task 1.2: Criação do Layout Base e Sidebar Baseado em Role
* **Arquivos alvo:** `src/layout/MainLayout.[jsx/tsx]`, `src/layout/Sidebar.[jsx/tsx]`.
* **Ação:** 1. Criar `MainLayout` que contenha um header superior e o `Sidebar` na esquerda. O conteúdo das rotas deve renderizar no centro (usando `Outlet` ou `children`).
  2. Criar `Sidebar` que leia a `role` do estado criado na Task 1.1 e renderize apenas os botões de Treeview listados na "Seção 4" do arquivo de PRD.
* **Critério de Aceite:** O Sidebar não deve renderizar botões de Gestor se o estado for `role: 'ALUNO'`.

### [x] Task 1.3: Rotas e Guards (Proteção)
* **Arquivo alvo:** `src/routes/index.[jsx/tsx]` (ou equivalente do framework).
* **Ação:** Configurar as rotas descritas no PRD. Criar um componente (ex: `RoleGuard`) que envolva as rotas globais (`/matriz/disciplinas`, `/matriz/financeiro`, etc) para expulsar quem não for `role === 'GESTOR'`.

---

## ÉPICO 2: Telas Globais do Gestor

### [ ] Task 2.1: Estrutura do Dashboard do Gestor
### [x] Task 2.1: Estrutura do Dashboard do Gestor
* **Arquivos alvo:** `src/pages/matriz/Dashboard.[jsx/tsx]`
* **Ação:** Criar a estrutura visual da tela com seções para Financeiro, Presença, Faltas e Notas.
* **Regras Antialucinação:** Não tente integrar com a API ainda. Preencha com componentes mockados (placeholders) indicando onde os gráficos/tabelas entrarão. Crie áreas clicáveis para o futuro "drilldown".

### [x] Task 2.2: Telas de Cadastros Base
* **Arquivos alvo:** `src/pages/matriz/Disciplina.[jsx/tsx]`, `src/pages/matriz/Academico.[jsx/tsx]`, `src/pages/matriz/Colaboradores.[jsx/tsx]`.
* **Ação:** Criar a UI dessas 3 telas contendo: um título, um botão "Novo Registro" e uma tabela de listagem genérica (componente de Tabela). Não conecte APIs ainda, apenas construa o Layout.

### [x] Task 2.3: Tela de Financeiro (Balanço e Fluxo)
* **Arquivos alvo:** `src/pages/matriz/Financeiro.[jsx/tsx]`
* **Ação:** Criar interface com filtros superiores (Data, Unidade) e duas áreas distintas na tela: uma tabela de Balanço e uma tabela de Fluxo de Caixa.

---

## ÉPICO 3: Fluxo "Multi-Escola" (Módulo Seletor e Visão Local)

### [x] Task 3.1: Tela "Seletor de Escola" (Para todos os perfis)
* **Arquivos alvo:** `src/pages/escola/SeletorEscolas.[jsx/tsx]`
* **Ação:** Tela simples que exibe "Cards" representando escolas. Ao clicar em um Card, deve disparar a action `setEscolaSelecionada(id)` da Task 1.1 e redirecionar para `/escola/:id/painel`.

### [x] Task 3.2: Layout Interno da Escola Específica
* **Arquivos alvo:** `src/pages/escola/PainelEscolaLayout.[jsx/tsx]`
* **Ação:** Criar um Sub-layout para quando o usuário está dentro de uma escola específica (rota `/escola/:id/*`). Este layout deve exibir o nome da escola selecionada no topo e renderizar abas (Tabs) ou um menu secundário.
* **Regras Antialucinação:** As abas exibidas neste sub-layout dependem estritamente da `role` do usuário, conforme definido na "Seção 5" do PRD.

### [ ] Task 3.3: Views Internas da Escola - Gestor
* **Arquivos alvo:** Componentes dentro de `src/pages/escola/gestor/`
* **Ação:** Criar as telas mockadas para: 1. Gerenciamento de Alunos locais; 2. Criação de Turmas (Dropdowns mockados para selecionar Professor e Alunos); 3. Cronograma.

### [ ] Task 3.4: Views Internas da Escola - Funcionário
* **Arquivos alvo:** Componentes dentro de `src/pages/escola/funcionario/`
* **Ação:** Criar a UI para: 1. Lista de Minhas Turmas. Ao clicar na turma -> Tela com abas para (Material, Notas, Presença). 2. Botão/Modal flutuante global na unidade para "Bater Ponto".

### [ ] Task 3.5: Views Internas da Escola - Aluno
* **Arquivos alvo:** Componentes dentro de `src/pages/escola/aluno/`
* **Ação:** Criar a UI para: Lista de Turmas matriculadas. Clicar na turma leva a uma view SOMENTE LEITURA de Material, Notas e Presenças. NENHUM botão de envio (submit) ou edição deve ser renderizado para este perfil.