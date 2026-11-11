# Spec: documento de entrega

## Objetivo e escopo

Criar `ENTREGA.md` na raiz para apresentar a prática EmpresTI, suas decisões,
artefatos, instruções de demonstração, verificações e pendências.

Publicar o documento e esta spec na branch `codex/demo-access`, conforme pedido.
Referências a artefatos existentes apenas na branch de implementação devem
apontar para o commit `c7362c8` no GitHub, preservando o escopo da branch demo.

## Restrições

Somente documentação. Não executar migrations ou deploy, expor segredos,
nem apresentar código preparado como funcionalidade validada em produção.
Registrar resultados anteriores como históricos, sem inventar nova execução.

## Critérios de aceite

- CA1: identificar objetivo, stack e decisões de negócio aprovadas.
- CA2: apontar specs, verificador, skill Pixabay, migration e fluxo preparados.
- CA3: explicar acesso ao mock, credenciais demonstrativas e limitações.
- CA4: distinguir verificações executadas, bloqueios e pendências da entrega.
- CA5: links locais válidos e referências externas fixadas no commit da implementação;
  nenhum segredo real; revisão pelo verificador.
- CA6: documento e spec commitados e enviados para `codex/demo-access`.

## Validação

Conferir referências locais e coerência com os arquivos e resultados registrados.
Não repetir build/testes de aplicação por mudança exclusivamente documental.
