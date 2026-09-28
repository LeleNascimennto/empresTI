---
description: Procedimento obrigatório para qualquer alteração de schema do banco
globs: ["supabase/migrations/**", "<CAMINHO-DO-ACESSO-A-DADOS>"]
alwaysApply: false
---

# Mudança de Schema
> leitor: agente

## Objetivo

Toda alteração estrutural no banco deve ser reproduzível por migrations,
versionada no Git e validada localmente.

O estado do banco não deve depender de alterações manuais feitas no
Supabase Studio ou diretamente no banco remoto.

---

## 1. Quando esta regra se aplica

Esta regra é obrigatória para qualquer tarefa que altere ou possa alterar:

- tabelas;
- colunas;
- tipos de dados;
- índices;
- primary keys;
- foreign keys;
- constraints;
- `CHECK`;
- `UNIQUE`;
- defaults;
- sequences;
- views;
- functions;
- triggers;
- Row Level Security (RLS);
- policies;
- permissões;
- extensões;
- qualquer outro objeto persistente do banco.

Também se aplica quando uma alteração aparentemente pequena exigir mudança
no schema existente.

---

## 2. Autoridade antes da migration

Antes de criar qualquer arquivo de migration:

1. consulte a spec correspondente;
2. verifique os ADRs relevantes;
3. identifique o schema atual;
4. determine o impacto da alteração;
5. escreva o DDL pretendido na resposta.

A proposta deve mostrar:

- objetos que serão criados;
- objetos que serão alterados;
- objetos que serão removidos;
- colunas e tipos;
- constraints;
- índices;
- policies;
- comportamento de dados existentes;
- possíveis riscos de migração.

### Regra obrigatória

Depois de apresentar o DDL:

> **PARE E AGUARDE APROVAÇÃO HUMANA.**

Não:

- crie a migration;
- execute a migration;
- execute SQL equivalente;
- altere o banco;
- continue para a implementação;

antes da aprovação.

"Pode implementar" autoriza somente a mudança aprovada.

Se o DDL precisar ser alterado posteriormente, apresente novamente a nova
proposta e aguarde aprovação.

---

## 3. Geração da migration

Somente após a aprovação do DDL:

```bash
supabase migration new <nome-da-migration>