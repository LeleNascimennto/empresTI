# Spec: remoção da restrição de conexão remota

## Objetivo
Remover a proibição documental de conectar ao Supabase remoto e testar a conexão quando solicitado pelo usuário.

## Escopo
- Remover proibições gerais de conectar/testar o Supabase remoto em `AGENTS.md`, `rules/restrictions.md`, `rules/migrations.md` e `rules/spec-flow.md`.
- Atualizar `spec/modelo-banco-prd.md` para não contradizer essa permissão.
- Tentar uma verificação de conectividade somente de leitura, conforme pedido anterior do usuário.

## Restrições
- Não alterar dados, schema, migrations ou configurações de produção como parte desta mudança documental.
- Usar a verificação de status do Prisma sem aplicar migrations.
- Preservar as restrições independentes sobre deploy e configuração da Vercel.
- Preservar a exigência de versionar mudanças de schema com Prisma Migrate e não editar migrations já publicadas.
- Não exibir credenciais em documentação ou resposta.

## Critérios de aceite
- Não há proibição geral de conexão ou teste de leitura contra Supabase remoto nos documentos operacionais.
- A spec da modelagem não proíbe conexão remota.
- As restrições de deploy e de alteração manual de dados/schema remoto permanecem.
- A tentativa de conexão é reportada sem revelar valores de ambiente.
