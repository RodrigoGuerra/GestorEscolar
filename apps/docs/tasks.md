# Feature Provisioning Task List

## Fase 1: Implementação do Provisionamento (Pré-cadastro)
- [ ] Criar DTO para provisionamento (`email`, `role`, `school_id`, `domain_data`)
- [ ] Atualizar entidades `User` e `FranchiseTenant` no `ms-identity` conforme PRD
- [ ] Implementar serviço de provisionamento no `ms-identity`
- [ ] Publicar evento `user.provisioned` via RabbitMQ
- [ ] Criar endpoint `POST /api/v1/users/provision`
- [ ] Validar operação no schema `public`

## Fase 2: Ativação e Login OAuth2
- [ ] Ajustar estratégia Google OAuth2 para buscar usuário pré-cadastrado
- [ ] Implementar atualização de perfil (nome, google_id) no primeiro login
- [ ] Gerar JWT com claims multi-tenant (`franchise_schema`, `school_id`, `role`)
- [ ] Criar interceptor de autorização baseado em claims (opcional neste microserviço se o Gateway já filtrar)
