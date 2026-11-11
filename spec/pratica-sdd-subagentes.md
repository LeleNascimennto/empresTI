# Spec: prática SDD, subagente e imagens de equipamentos

## Objetivo

Concluir as entregas da prática `pratica/pratica-sdd-subagentes.html`: verificador de specs obrigatório e comprovado por erro plantado, skill `imagens-equipamentos` restrita à API Pixabay (alteração solicitada pela professora), specs aprovadas para dados iniciais e solicitação de empréstimo, implementação validada e `ENTREGA.md` com decisões e evidências.

## Escopo

- Revisar e completar o subagente `agents/verificador-spec.md` e a regra que impede declarar specs prontas sem a revisão dele.
- Demonstrar uma reprovação real com fixture temporária, sem deixar erro plantado no produto.
- Criar `skills/imagens-equipamentos/SKILL.md` e os recursos/scripts mínimos para seleção via Pixabay, normalização 800×600 com Sharp, registro de origem/licença, deduplicação e armazenamento Supabase idempotente.
- Criar e validar specs separadas para dados iniciais e solicitação de empréstimo antes de implementar essas entregas.
- Implementar as funcionalidades e documentação `ENTREGA.md` aprovadas nas duas specs.

## Restrições

- Apenas Pixabay API para fotos de equipamentos; nenhuma fonte alternativa. A troca de Pexels por Pixabay foi pedida pela usuária conforme orientação da professora.
- Nunca escrever em banco, Auth ou Storage de produção. A usuária executa manualmente qualquer preparação ou seed de produção.
- Não gravar chaves, senha padrão ou credenciais no código, specs, logs ou Git.
- Não alterar schema, decisões de negócio, comportamento de empréstimo ou status dos equipamentos sem decisão registrada da usuária.
- Preservar o Nocturne, ADRs, isolamento por tenant e o escopo da v1.
- O verificador não edita, corrige, comita, publica, migra nem escreve em produção.

## Critérios de aceite

- CA-01: o verificador tem papel, entrada/saída repetível, leitura de regras, exigência de evidência por CA e proibições de escrita/produção; a regra do repositório o torna etapa obrigatória antes de concluir specs.
- CA-02: uma falha intencional em fixture isolada faz o verificador reprovar; a fixture defeituosa é removida depois e a prova fica documentada sem quebrar produto.
- CA-03: a skill usa exclusivamente Pixabay e garante ou explicita mecanismo verificável para filtros visuais, 800×600, unicidade, metadados/licença, Storage público e idempotência; não dispõe de credencial de produção.
- CA-04: existe spec aprovada para os dados iniciais, após resolver contradições e lacunas do briefing.
- CA-05: existe spec aprovada para empréstimos, compatível com as decisões da usuária, PRD e ADR.
- CA-06: as implementações aprovadas passam nos checks aplicáveis e nenhuma escrita remota de produção é feita pelo agente.
- CA-07: `ENTREGA.md` registra conflitos, lacunas, decisões e alternativas, provas e evidências verificáveis.

## Decisões da usuária

- Limite simultâneo: 5 empréstimos ativos, conforme o briefing, substituindo o limite atual de 3.
- Prazo: 14 dias úteis, excluindo fins de semana e feriados nacionais brasileiros, conforme decisão da usuária.
- `TI-0010`: manutenção, conforme a lista padronizada da prática; fica em conflito com o briefing, que cita apenas `TI-0004` e `TI-0007`.
- Cancelamento: pedido pode ser cancelado antes da retirada; colaborador confirma a retirada em `Meus empréstimos`, iniciando a contagem do prazo. Pedidos pendentes contam no limite total de cinco e expiram em 24 horas úteis.
- Chave Pixabay: exceção local-only autorizada; documentada em `rules/secrets.md` e `.env.example`, fora da Vercel.

Essas decisões devem ser refletidas no PRD e em `AGENTS.md`, que são as fontes normativas para as próximas implementações. Registrar o conflito de `TI-0010` em `ENTREGA.md`.

O briefing também pede gravar a senha padrão no seed. Isso conflita com as regras de segredo do repositório; a conta do professor será pré-provisionada manualmente pela usuária no Supabase Auth, sem senha no código ou histórico. O seed local apenas associa o UUID fornecido e garante zero empréstimos.

## Decisões operacionais resolvidas

- Fonte de imagens: Pixabay API, conforme orientação da professora; usar `PIXABAY_API_KEY` local, sem revelar, ler seu valor para logs, ou gravar em arquivos versionados.
- Dependência Sharp: instalação autorizada pela usuária para garantir 800×600.
- Crédito visual: registrar origem/licença por imagem. A exigência da prática de link visível cita Pexels e será reavaliada nas instruções específicas para Pixabay, sem inventar exigência equivalente.

## Pendências de validação

- A verificação segura neste checkout não encontrou `PIXABAY_API_KEY` no `.env`; nenhum valor foi lido ou exposto. O script deve falhar com orientação clara se a variável não estiver disponível no ambiente local de execução.
- Sharp foi autorizado pela usuária e é a biblioteca solicitada pelo briefing; sua instalação fica depois da aprovação das specs de implementação.

## Validação

- Prova controlada do verificador: resultado reprovado antes e resultado limpo depois da restauração da fixture.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e `git diff --check`, conforme aplicabilidade.
- Revisão do diff e confirmação de que nenhum segredo, fixture defeituosa ou escrita em produção entrou na entrega.

## Progresso

- [x] Ler o enunciado e localizar as regras/specs existentes.
- [x] Resolver as três decisões de negócio com a usuária.
- [x] Atualizar PRD e síntese AGENTS com as decisões de limite e prazo.
- [x] Resolver fonte Pixabay, autorização para Sharp, feriados nacionais e exceção local-only da chave.
- [ ] Revisar o contrato do verificador e executar a prova isolada.
- [ ] Criar a skill Pixabay e seus mecanismos verificáveis.
- [ ] Escrever, aprovar e verificar as specs de dados iniciais e empréstimos.
- [ ] Implementar apenas após aprovação das specs.
- [ ] Criar `ENTREGA.md` e executar checks finais.
