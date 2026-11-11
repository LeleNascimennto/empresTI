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

Para validar o comportamento do verificador, deve existir uma simulação intencional de falha em uma spec.

### Cenário

- Spec com dois critérios de aceite:
  - CA-01: o catálogo mostra apenas itens disponíveis;
  - CA-02: itens em manutenção não aparecem como disponíveis.
- Implementação de teste: uma alteração proposital que remove a filtragem de manutenção e não cria o teste correspondente para os critérios de aceite.
- Objetivo: confirmar que o verificador reaproveita a regra de "sem evidência = reprova" e não aprova apenas pela aparência.

### Saída esperada do verificador

| CA | evidência (arquivo:linha do teste ou trecho relevante) | status | observação |
|---|---|---|---|
| CA-01 | inexistente | SEM TESTE | Falta evidência de que o catálogo lista apenas itens disponíveis |
| CA-02 | inexistente | SEM TESTE | Nenhum teste valida que itens em manutenção não aparecem como disponíveis |

Checks: npm test → falhou | npm run build → falhou
Fora de escopo: nada encontrado
Veredito: NÃO PRONTA — faltam evidências dos critérios de aceite e não há teste que comprove o comportamento

### Procedimento de verificação

1. Plantar a falha intencional no código ou no teste.
2. Executar a avaliação do verificador.
3. Confirmar que o status final é "NÃO PRONTA".
4. Desfazer a falha intencional.
5. Executar novamente e confirmar que o resultado foi revertido para a avaliação normal.

## Tarefas

1. Definir o papel do subagente e o contrato de entrada e saída.
2. Criar o arquivo do subagente em `agents/`.
3. Incluir as regras de leitura e o fluxo de verificação.
4. Reforçar as proibições de edição e produção.
5. Validar com um cenário de erro plantado e confirmar a resposta esperada.

## Evidência de conclusão

A spec está concluída quando o verificador foi criado, as regras foram explicitadas, e a validação de erro plantado mostrou que ele reprova corretamente o que deve ser reprovado.
