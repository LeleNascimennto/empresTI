# Spec: skill imagens-equipamentos

## Objetivo

Definir um fluxo reproduzível para selecionar, revisar e preparar fotos de
equipamentos do catálogo, usando somente a Pixabay API e seguindo a regra de
que o agente não escreve no Supabase de produção.

## Atualização de escopo — 2026-11-11

A usuária pediu que as imagens selecionadas do Pixabay apareçam no catálogo e
que o preparo dos 12 equipamentos gere dados utilizáveis para carga no projeto.
O código da aplicação deve exibir `imageUrl` já persistida; o preparador local
gera arquivos e manifesto, mas não envia arquivos nem grava linhas no Supabase.
As regras operacionais continuam exigindo Prisma Migrate para schema e vedam
escrita remota direta pelo agente.

## Escopo

- Criar `skills/imagens-equipamentos/SKILL.md` com nome/descrição que a tornem
  encontrável para preparação de fotos de equipamentos.
- Criar script local pequeno para buscar fotos, baixar por URL temporária,
  normalizar 800×600 JPEG com Sharp e produzir manifesto com patrimônio,
  Pixabay photo id/page URL, contributor/profile URL e referência à Pixabay
  Content License.
- API key somente em uso local; não enviar ao browser, não imprimir URL que a
  inclua e não registrar valor em erro/log. Não pesquisar em outros provedores.
- Limitar as chamadas aos 12 equipamentos pedidos, armazenar resultados da API
  localmente por pelo menos 24 horas, respeitar rate limit e não automatizar
  consultas em massa.
- Revisão humana antes de aceitar: rejeitar pessoas, marcas/logos legíveis,
  texto e conteúdo legível em telas. Uma foto Pixabay id única por equipamento.
- Catálogo final exibe fotos escolhidas, não os resultados de busca da API; não
  mostra texto/rodapé de crédito conforme briefing. Metadados preservam autor e
  origem. A licença Pixabay não exige atribuição, embora a recomende.
- Nenhum script da skill usa credencial Supabase de produção ou executa upload.
  A pessoa fará manualmente o envio ao bucket público definido por ela.

## Fora de escopo

Busca de fotos genéricas fora do catálogo, outros provedores, reconhecimento
automático de conteúdo, upload automático, escrita remota e tela de catálogo.

## Critérios de aceite

- CA-SK-01: frontmatter correto e descrição acionada apenas por tarefas de
  fotos reais de equipamentos.
- CA-SK-02: integração exclusivamente Pixabay; nenhuma chave em cliente, Git,
  log ou URL de erro.
- CA-SK-03: saída garantida em 800×600 JPEG por transformação Sharp; teste
  confere formato e dimensões do arquivo produzido.
- CA-SK-04: manifesto preserva id, página, autor, licença e patrimônio; não há
  IDs duplicados entre equipamentos.
- CA-SK-05: regra de inspeção visual humana, rejeição de fotos inadequadas e
  cache/rate limit da API estão documentados e são executáveis no fluxo.
- CA-SK-06: não há credencial ou operação de escrita no Supabase/produção.
- CA-SK-07: não exibe crédito na tela; guarda metadados de proveniência. Isso
  segue a escolha da usuária e a licença Pixabay, mas a API pede indicação de
  origem sempre que resultados de busca são exibidos; a app não os exibe.

## Validação

Teste com fixture local sem chave: falha com instrução curta, não imprime
segredo. Teste com fixture de resposta Pixabay: manifesta os campos esperados;
teste Sharp valida 800×600; busca verifica ausência de chave real no diff/Git.
Não chamar API real nem fazer upload durante testes.

## Pendências

- A presença de `PIXABAY_API_KEY` não foi encontrada neste checkout; o arquivo
  `.env` local deste worktree precisa ser preparado manualmente pela usuária.
- A usuária autorizou exceção local-only; `rules/secrets.md` e `.env.example`
  registram a variável como ferramenta local, sem cadastro na Vercel.

## Execução desta etapa

Escopo autorizado em 2026-11-11: implementar esta skill e seu preparador local
Pixabay/Sharp, sem upload remoto. A chave não está visível neste checkout e
deve permanecer fora de mensagens, logs e diffs.
