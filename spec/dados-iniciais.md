# Spec: dados iniciais de equipamentos

## Objetivo

Preparar uma carga repetível dos 12 equipamentos definidos em
`pratica/pratica-sdd-subagentes.html`, com fotos revisadas via Pixabay e a
membership do professor, sem gravar em produção pelo agente.

## Atualização de escopo — 2026-11-11

A usuária pediu que as imagens do Pixabay apareçam no catálogo e que o agente
execute operações no Supabase. A interface já consome `imageUrl`; o gerador
deverá incluir categoria e situação no manifesto de carga. A escrita remota
continua bloqueada pelas regras do repositório: produção só recebe migrations
Prisma pelo fluxo de CI, e o agente não grava dados diretamente no Supabase.
O banco foi consultado somente para leitura e retornou zero tabelas públicas e
zero migrations visíveis.

## Escopo

- Criar/upsert local dos 12 equipamentos por `(tenant_id, asset_tag)`.
- Estados conforme decisão explícita da usuária em 2026-11-11 (resposta à
  pergunta sobre TI-0010):
  TI-0004, TI-0007 e TI-0010 em manutenção; os outros nove disponíveis. Isso
  prevalece sobre o parágrafo conflitante do briefing que afirma que os outros
  dez estão disponíveis.
- Buscar fotos somente pela API oficial Pixabay, usando `PIXABAY_API_KEY` no
  processo local de preparação. Não registrar a URL de busca (a chave vem em
  query string), corpo com segredo, nem valor da variável em logs. A chave não
  é usada pelo runtime do app nem necessária em Vercel; `rules/secrets.md`
  define a exceção local-only para essa ferramenta.
- Revisão humana obrigatória das fotos: sem pessoa, logo/marca legível, texto ou
  conteúdo legível em tela. Uma foto única por patrimônio.
- Transformar cada imagem para JPEG 800×600 usando Sharp; metadados guardam
  `provider=Pixabay`, id e URL da foto, autor e licença/URL de licença.
- O processo que prepara arquivos não usa credencial de produção e não faz
  upload ao Storage remoto. Repetir a preparação/carga local não duplica dados.
- Alinhar o ponto de entrada local ao ADR-001 e a `rules/migrations.md`:
  implementar `prisma/seed.ts` e atualizar `npm run db:seed` para executá-lo
  com o suporte de stripping de tipos nativo do Node (sem nova dependência).
  O seed local recusa host não local antes de escrita. Um script
  `prisma/seed-practice-production.mjs`
  é preparado para a usuária executar manualmente em produção, inicia em
  dry-run e só grava com flag `--confirm-production` mais confirmação digitada
  após mostrar o tenant/alvo. O agente nunca executa o script de produção.
  A carga é transacional, idempotente, nunca apaga dados e falha se encontrar
  conflitos ou empréstimos do professor.
- A usuária cria/valida um bucket público `equipment-images` e envia os 12 JPEGs
  pelo painel Supabase. O script de carga só grava as URLs públicas previsíveis
  `.../equipment-images/TI-XXXX.jpg`; não envia arquivos nem precisa de
  `SUPABASE_SERVICE_ROLE_KEY`.
- A conta do professor é provisionada pela usuária no Auth. O script recebe o
  UUID já existente, vincula-o como colaborador e falha se houver empréstimos;
  não cria senha, não cria usuário remoto e não apaga dados.

## Schema proposto (DDL aprovado em 2026-11-11)

Adicionar ao model `Equipment`: `imageUrl String? @map("image_url")`,
`imageSourceUrl String? @map("image_source_url")`,
`imageProviderPhotoId String? @unique @map("image_provider_photo_id")`,
`imagePhotographer String? @map("image_photographer")`,
`imageLicense String? @map("image_license")`.
O ID Pixabay tem unicidade global; `@unique` em campo opcional permite vários
`NULL`, então equipamentos ainda sem foto continuam válidos, e impede que uma
mesma foto seja associada a dois equipamentos, inclusive entre tenants.

Sem nova tabela ou policy: os metadados ficam na linha de equipamento já
protegida por tenant/RLS. A usuária fará upload manual para bucket público de
Storage depois que bucket e URLs estiverem configurados; o agente não grava no
Supabase remoto.

## Fora de escopo

Catálogo UI, criação de usuário/senha Auth, limpeza de dados existentes e
execução da carga remota pelo agente. A carga e o upload em produção são
preparados para execução exclusiva da usuária, conforme a prática.

## Critérios de aceite

- CA-DI-01: os 12 patrimônios, nomes/categorias/situações são exatos à lista
  padronizada; conflito TI-0010 fica registrado.
- CA-DI-02: carga local repetida não cria duplicatas; conflitos não são
  resolvidos apagando dados.
- CA-DI-03: todas as 12 fotos vêm do Pixabay, são únicas, revisadas e JPEG
  800×600; metadados de fonte/autor/licença são guardados.
- CA-DI-04: teste executável comprova falha clara se `PIXABAY_API_KEY` faltar;
  teste/verificação não revela o valor; busca por chave real não retorna nada
  no diff/Git. A variável é exclusivamente de ferramenta local. A chave não
  deve entrar no runtime da aplicação nem no painel Vercel; `rules/secrets.md`
  define agora a exceção para ferramenta exclusivamente local.
- CA-DI-05: conta do professor é associada por UUID pré-existente e permanece
  com zero empréstimos; o script de produção é apenas preparado, inicia em
  dry-run e exige flag + confirmação digitada para execução manual pela usuária;
  é transacional, idempotente, não cria/altera Auth nem envia arquivos; o agente
  nunca o executa.
- CA-DI-06: testes de integração com Postgres local provam que duas execuções
  com os mesmos 12 patrimônios deixam exatamente 12 equipamentos e uma
  membership. Teste prova que `prisma/seed.ts` recusa host não local antes de
  qualquer escrita; revisão do script de produção prova modo dry-run padrão,
  exigência da flag e da confirmação digitada, sem executar contra banco remoto.
  Testes de imagem provam formato/dimensões e IDs únicos.

## Riscos / validação

- A usuária informa UUID local do usuário do professor; senha não entra no seed.
- A atividade exige os dados em produção, mas proíbe escrita pelo agente. A
  especificação separa a preparação/teste local (pelo agente) da carga de
  produção que a usuária executará manualmente após conferir os dados.
- A chave não estava presente no `.env` deste checkout na checagem segura de
  presença. A usuária precisa configurá-la localmente antes de buscar fotos.
- Evidência de TI-0010: decisão da usuária em 2026-11-11: “Manutenção (lista da
  prática)”, prevalecendo sobre o parágrafo divergente do briefing.
- Revisão inicial do subagente (rodada de prova controlada): NÃO PRONTA por
  CA-DI-PROVA plantado intencionalmente e lacunas em CA-DI-01/04/06. O agente
  não alterou a spec; o agente principal removeu o pedido inseguro e esclareceu
  as decisões e verificações. Resultado completo fica em `ENTREGA.md`.
- A usuária aprovou o DDL acima em 2026-11-11 e solicitou
  execução remota. A migration será criada e validada pelo Prisma; execução em
  produção precisa passar pelo GitHub Actions conforme ADR-001. Este checkout
  não contém workflow configurado, então não aplicar diretamente no Supabase.
- Verificar 12 imagens, dimensões, unicidade, ausência de vazamento da chave,
  idempotência e `git status` sem `.env`.
