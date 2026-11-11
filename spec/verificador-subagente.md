 # Spec: verificador de specs

## Objetivo

Criar um subagente de verificação que avalia, com contexto limpo, se uma spec está pronta para ser declarada concluída, sem escrever código, sem corrigir a implementação e sem declarar sucesso sem evidência.

## Escopo

- Definir o papel do verificador no repositório.
- Garantir que ele leia as regras e a spec antes de avaliar.
- Exigir evidência por critério de aceite e por teste relevante.
- Impedir que o verificador corrija código, faça commit ou publique em produção.
- Garantir que a saída seja comparável entre execuções.
- Permitir uma prova de erro plantado para validar a reprovação correta.

## Restrições

- O verificador não pode editar arquivos.
- O verificador não pode corrigir testes nem implementar código.
- O verificador não pode executar migração, push, deploy ou alterar banco de produção.
- O verificador deve operar com contexto limpo e sem herdar a conversa do agente principal.
- O verificador precisa validar a spec contra os critérios de aceite, a regra de negócio e os checks da tarefa.

## Critérios de aceite

- O subagente existe em `agents/` e tem frontmatter com nome e descrição.
- A descrição explicita que ele verifica a implementação da spec com contexto limpo.
- O verificador lê, nesta ordem, as instruções relevantes do repositório antes de avaliar.
- A saída de verificação é uma tabela com CA, evidência, status e observação.
- A saída também informa os checks executados e o veredito final.
- A avaliação exige teste ou evidência explícita para cada critério de aceite.
- O verificador não aprova critério ambíguo ou sem evidência.
- O verificador pode reprovar corretamente um caso de erro plantado de propósito.

## Prova de erro plantado

Para validar o comportamento do verificador, executar uma simulação isolada de falha em uma spec. A falha fica em fixture temporária de teste, nunca no código de produto.

### Cenário

- Spec com dois critérios de aceite:
  - CA-01: o catálogo mostra apenas itens disponíveis;
  - CA-02: itens em manutenção não aparecem como disponíveis.
- Fixture: uma função de catálogo intencionalmente defeituosa que deixa passar item em manutenção, acompanhada de testes dos dois critérios.
- Objetivo: confirmar que o verificador relata a falha observada e não aprova a spec só porque há testes; depois, corrigir a fixture e confirmar que os testes passam.

### Evidência que deve ser registrada após a execução

- Saída real do subagente verificador durante a fixture defeituosa, incluindo tabela, checks e veredito.
- Resultado do teste da fixture após a correção.
- Confirmação de que os arquivos temporários foram removidos e que nenhum código do produto foi alterado pela simulação.

### Procedimento de verificação

1. Criar uma fixture temporária com os critérios CA-01 e CA-02 e a filtragem de manutenção ausente.
2. Executar os testes da fixture e pedir ao subagente que avalie somente esse cenário, sem editar nada.
3. Confirmar que a saída real indica a falha e não declara a fixture pronta.
4. Corrigir a função temporária e executar novamente os testes da fixture.
5. Manter a fixture corrigida como caso reproduzível e registrar os resultados observados nesta seção.

### Execução

Executada em 11/11/2026 em fixture isolada, sem alterar código de produto.

1. A fixture temporária foi criada em `src/test/verifier-proof/` com uma
   implementação que retornava todos os equipamentos, inclusive manutenção.
2. O teste direcionado falhou nos dois critérios:
   - CA-01 esperava `["TI-0001"]`, mas recebeu `["TI-0001", "TI-0002"]`.
   - CA-02 esperava `false` para presença de item em manutenção, mas recebeu
     `true`.
3. O subagente verificador avaliou `spec/verificador-erro-plantado.md` e
   retornou:

   | CA | evidência | status | observação |
   |---|---|---|---|
   | CA-01 | `src/test/verifier-proof/catalog.test.mjs:10-13`; implementação em `src/test/verifier-proof/catalog.ts:6-7` | REPROVADO | Esperava apenas `TI-0001`, mas também recebeu `TI-0002`. |
   | CA-02 | `src/test/verifier-proof/catalog.test.mjs:17-20`; implementação em `src/test/verifier-proof/catalog.ts:6-7` | REPROVADO | O teste encontrou equipamento em manutenção (`true`, esperado `false`). |

   Checks: `node --experimental-strip-types --test src/test/verifier-proof/catalog.test.mjs` → falhou (2 testes falharam; código de saída 1).
   Fora de escopo: nada encontrado nos fixtures examinados.
   Veredito: NÃO PRONTA — os dois critérios de aceite falharam.
4. A função isolada foi corrigida para filtrar `conditionStatus === "AVAILABLE"`.
   Reexecutado o mesmo comando: 2 testes passaram, 0 falharam, código de saída
   0. A fixture corrigida foi mantida para tornar a evidência reproduzível.

O comando `npm test -- src/test/verifier-proof/catalog.test.ts` não iniciou os
workers do Vitest neste ambiente e terminou com timeout antes de descobrir
testes. Por isso, a prova isolada usa o runner nativo do Node 22 e não altera
dependências nem configuração do Vitest. A avaliação independente foi feita
na versão defeituosa; após a correção, confirmou-se o retorno ao estado válido
executando o mesmo teste, sem uma segunda rodada independente do subagente.

Validação complementar: `npm test` terminou com `No test files found` (o
Vitest está configurado apenas para `.test.ts`/`.test.tsx`); `npm run lint` e
`npm run build` passaram. Para o check de whitespace em arquivos CRLF foi
necessário `git -c core.whitespace=cr-at-eol diff --check`.

## Tarefas

1. Definir o papel do subagente e o contrato de entrada e saída.
2. Criar o arquivo do subagente em `agents/`.
3. Incluir as regras de leitura e o fluxo de verificação.
4. Reforçar as proibições de edição e produção.
5. Validar com uma fixture isolada de erro plantado, registrar a saída real do verificador e comprovar que a correção remove a falha.

## Evidência de conclusão

A spec está concluída quando o verificador foi criado, as regras foram explicitadas, e a validação de erro plantado mostrou que ele reprova corretamente o que deve ser reprovado.
