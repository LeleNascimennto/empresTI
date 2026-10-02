# Spec: modelo de banco alinhado ao PRD

## Objetivo
Modelar e implementar o schema de persistência mínimo para a v1 do EmpresTI, coerente com as regras do PRD e com isolamento por tenant.

## Escopo
- Mapear entidades, chaves, relações, estados e invariantes persistidas necessárias para usuários/memberships, equipamentos e empréstimos.
- Registrar decisões ainda em aberto no PRD que afetam o modelo, incluindo ciclo de solicitação/retirada, histórico de devoluções e provisionamento por convite.
- Produzir schema Prisma, migration PostgreSQL e seed local após resolver as decisões de negócio e obter aprovação do DDL.
- A pedido explícito do usuário, verificar novamente a conexão e, se disponível, aplicar a migration inicial versionada ao Supabase remoto via Prisma Migrate.
- Validar a proposta contra as regras de limite de 3 empréstimos ativos, prazo de 14 dias, bloqueio por atraso, manutenção e isolamento de tenant.

## Restrições
- Não editar `.env`.
- Prisma Migrate é o único dono de schema; a migration inicial foi criada após aprovação explícita do DDL pretendido.
- Aplicar somente migrations versionadas com `prisma migrate deploy`; não executar SQL avulso, seed ou alterações manuais no banco remoto.
- `tenant_id` é resolvido da sessão/contexto e não é confiado ao input do cliente.
- Não incluir reserva futura, notificações por e-mail ou importação da planilha.
- Não inventar comportamento para questões de negócio ainda sem resposta.

## Decisões confirmadas pelo usuário
- Solicitar equipamento cria imediatamente um empréstimo ativo; não existe estado intermediário de aprovação/retirada.
- Manter o histórico completo de empréstimos após a devolução.
- Convites são feitos pelo administrador fora do EmpresTI, no Supabase Auth; não criar tabela de convite.
- Na associação do primeiro login, atribuir `COLLABORATOR` ao tenant padrão; papel `ADMIN`/Operações é atribuído separadamente.
- `ADMIN` e Operações representam o mesmo papel.
- O primeiro `ADMIN` é provisionado pelo seed local; alterações posteriores de papel são feitas por operação administrativa server-side.
- Para RLS efetivo com Prisma, usar role de runtime sem `BYPASSRLS` e definir o tenant com configuração local à transação; essa abordagem diverge da conexão como owner descrita no ADR-001 e precisa ser reconciliada antes de configurar o runtime. O ADR não foi alterado.

## Modelo conceitual proposto
- `Tenant`: organização/área isolada; seed cria `suporte_ti`.
- `Membership`: associação `(tenant_id, user_id)` e papel; `user_id` referencia a identidade gerida pelo Supabase Auth.
- `Equipment`: unidade física com patrimônio único por tenant, nome, categoria e condição (`AVAILABLE` ou `MAINTENANCE`).
- `Loan`: histórico de retirada/devolução; empréstimo aberto tem `returned_at` nulo. Prazo e atraso são datas derivadas/registradas, não estados duplicados.
- `AuditLog`: registro append-only requerido pelo ADR-001 para ator, tenant, ação e recurso; é distinto do histórico operacional de empréstimos.
- “Emprestado” é derivado de Loan aberto; equipamento em manutenção não pode receber Loan.
- Fora de uso/aposentado não foi incluído: o PRD não define esse estado para a v1.
- Limite de três e bloqueio por atraso dependem de transação/serviço; índice único parcial impede dois Loans abertos para o mesmo equipamento.

## Critérios de aceite
- Cada entidade e relação tem justificativa ligada ao PRD/ADR e tenant ownership claro.
- Ambiguidades que mudam cardinalidade, ciclo de vida ou retenção de dados são resolvidas com o usuário ou ficam explicitamente bloqueadas.
- Regras de domínio têm representação persistente suficiente e limites de garantia identificados (constraint/transação/service).
- O DDL/schema foi mostrado e aprovado antes da migration inicial.
- Conexão de verificação e consultas de leitura ao banco remoto podem ser executadas quando solicitadas. A aplicação da migration inicial só pode ocorrer com pedido explícito do usuário e pelo fluxo Prisma Migrate.
- A tentativa usa exclusivamente a migration aprovada, verifica o status antes de aplicar e informa sucesso ou o bloqueio sem divulgar credenciais.
