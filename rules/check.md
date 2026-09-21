---
description: Verificações obrigatórias antes de declarar uma tarefa concluída
globs: []
alwaysApply: true
---

# Checks de fim de tarefa
> leitor: agente

## Objetivo

Uma tarefa só pode ser declarada como concluída quando:

- a implementação atende à especificação;
- os checks obrigatórios passam;
- não existem alterações fora do escopo;
- o critério de aceitação correspondente foi validado.

"Pronto", "implementado", "concluído" ou "funcionando" só podem ser usados
quando todas as condições deste arquivo forem satisfeitas.

---

## 1. Quando executar

Execute este procedimento sempre antes de declarar uma tarefa como:

- pronta;
- implementada;
- concluída;
- funcionando;
- apta para PR;
- apta para push.

Não declare sucesso antes de concluir todos os checks aplicáveis.

---

## 2. Antes dos checks

Confirme:

1. qual especificação em `docs/specs/` está sendo implementada;
2. qual(is) critério(s) de aceitação `CA-xx` a tarefa deve atender;
3. quais arquivos fazem parte do escopo;
4. se a tarefa envolve código, testes, migration, configuração ou
   infraestrutura.

Se não for possível determinar qualquer um desses pontos, pare e peça
orientação.

---

## 3. Testes

Execute o conjunto de testes definido pelo projeto.

```bash
<COMANDO-TESTES>
