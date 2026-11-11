# Caso isolado: erro plantado no catálogo

## Objetivo
Verificar que o subagente reprova uma implementação que não atende os critérios de aceite.

## Escopo
- CA-01: o catálogo lista somente equipamentos disponíveis.
- CA-02: equipamentos em manutenção não aparecem entre os disponíveis.
- Avaliar exclusivamente a fixture temporária em `src/test/verifier-proof/`.

## Fixture
`src/test/verifier-proof/catalog.ts` implementa o filtro de equipamentos disponíveis.
Os critérios são exercitados em `src/test/verifier-proof/catalog.test.mjs`.
Na execução registrada em `spec/verificador-subagente.md`, o filtro foi
intencionalmente removido para plantar o erro, e depois restaurado.

## Checks
Executar `node --experimental-strip-types --test src/test/verifier-proof/catalog.test.mjs`. Com a fixture corrigida, os dois casos passam. A fixture usa o runner nativo do Node porque o Vitest deste ambiente não conseguiu iniciar workers; isso não altera dependências ou configuração do projeto.

## Restrições
Não alterar código de produto, banco, ambiente, dependências, branch ou deployment. O verificador não corrige a fixture; a correção cabe ao agente principal.
