---
description: Restrições obrigatórias para agentes que atuam neste projeto
globs: []
alwaysApply: true
---

# Restrições do Agente

> Este arquivo define limites obrigatórios para qualquer agente que
> modifique, execute ou analise este projeto.
>
> As regras abaixo têm prioridade sobre preferências implícitas do agente.
> Quando uma regra exigir decisão humana, o agente deve parar e perguntar.

---

## 1. Autoridade e decisões

- Não tome decisões arquiteturais, de produto ou de negócio por conta própria.
- Não invente requisitos, comportamentos, regras de negócio ou critérios de
  aceitação que não estejam documentados.
- Quando houver ambiguidade relevante, liste as dúvidas objetivamente e pare.
- Não escolha entre alternativas arquiteturais sem autorização explícita.
- Não introduza uma nova biblioteca, framework, serviço ou ferramenta sem
  autorização.
- Não substitua uma tecnologia existente por outra apenas por considerá-la
  "melhor".
- Não altere contratos públicos, APIs, schemas ou formatos de dados sem
  autorização explícita.

### ADRs

- Não crie, edite ou remova ADRs.
- Não contradiga uma decisão registrada em `docs/adr/`.
- Se a implementação necessária entrar em conflito com um ADR:
  1. explique o conflito;
  2. apresente as alternativas;
  3. pare e aguarde uma decisão humana.
- Se uma decisão nova exigir ADR, não crie o ADR por conta própria.

### PRD e especificações

- O PRD e as especificações existentes são a fonte de verdade para
  comportamento funcional.
- Não preencha lacunas do PRD com suposições.
- Se o PRD for ambíguo, identifique exatamente o que precisa ser decidido
  e pare.
- Não escreva código de funcionalidade que não possua uma especificação
  correspondente em `docs/specs/`.

---

## 2. Escopo da tarefa

- Trabalhe exclusivamente no escopo solicitado.
- Não altere arquivos não relacionados à tarefa.
- Não faça "melhorias extras" enquanto implementa uma tarefa.
- Não refatore código adjacente apenas porque encontrou uma oportunidade.
- Não altere dependências, configurações ou infraestrutura sem necessidade
  direta para a tarefa.
- Não renomeie arquivos, funções, classes, tabelas ou variáveis fora do
  escopo sem autorização.
- Não remova código aparentemente obsoleto sem confirmação.
- Não altere testes existentes apenas para fazer a implementação passar.

### Novos arquivos

- Antes de criar arquivos fora do conjunto esperado pela tarefa, informe
  quais arquivos serão criados e por quê.
- Não gere scaffolding automático de framework sem apresentar previamente
  os arquivos que serão criados.
- Não execute geradores que possam modificar grande parte do projeto sem
  autorização.

---

## 3. Plano antes da implementação

- Antes de escrever código, produza um plano curto e verificável.
- O plano deve informar:
  - objetivo;
  - arquivos que serão alterados;
  - arquivos que serão criados;
  - principais mudanças;
  - testes/checks que serão executados.
- Aguarde aprovação antes de implementar.

### Execução incremental

- "Pode implementar" não significa autorização para executar todas as
  tarefas possíveis.
- Execute somente a próxima tarefa aprovada.
- Após concluir uma tarefa:
  1. rode os checks relevantes;
  2. informe exatamente o que foi alterado;
  3. informe os resultados dos checks;
  4. pare.
- Não avance automaticamente para a próxima tarefa.

---

## 4. Código

- Não escreva código especulativo.
- Não implemente funcionalidades que não foram solicitadas.
- Não introduza abstrações prematuras.
- Prefira a menor mudança necessária para cumprir a especificação.
- Preserve as convenções existentes do projeto.
- Não altere comportamento existente sem que isso faça parte da tarefa.
- Não silencie erros apenas para fazer os testes passarem.
- Não use `TODO`, `FIXME` ou código temporário para esconder uma decisão
  que deveria ser tomada pelo time.
- Não deixe código morto, debug ou logs temporários na implementação final.

### Dependências

- Não adicione dependências sem justificar a necessidade.
- Não atualize versões de dependências sem que isso seja necessário para
  a tarefa.
- Não substitua dependências existentes por alternativas sem autorização.
- Respeite as bibliotecas permitidas pelos ADRs do projeto.

---

## 5. Testes e validação

- Toda alteração de comportamento deve possuir validação adequada.
- Execute os testes relevantes após a implementação.
- Execute lint, type-check, build ou outros checks definidos pelo projeto
  quando forem aplicáveis.
- Não declare uma tarefa como concluída enquanto houver check obrigatório
  falhando.
- Não ignore falhas de teste sem explicar a causa.
- Não altere um teste apenas para fazê-lo passar quando a implementação
  estiver incorreta.
- Se um teste revelar comportamento incompatível com a especificação,
  pare e informe o conflito.

### Resultado dos checks

Ao finalizar uma tarefa, informe:

- `PASS` — checks concluídos com sucesso.
- `FAIL` — algum check obrigatório falhou.
- `BLOCKED` — não foi possível validar por alguma dependência externa.

Não classifique como concluída uma tarefa com status `FAIL` ou `BLOCKED`.

---

## 6. Dados e banco de dados

- Não execute operações destrutivas em bancos sem autorização explícita.
- Não execute `DROP`, `TRUNCATE`, `DELETE` em massa ou migrações destrutivas
  sem autorização.
- Não altere dados de produção.
- Não use dados reais para testes quando dados de teste forem suficientes.
- Não exponha credenciais, tokens, chaves ou dados sensíveis nos arquivos,
  logs ou respostas.

### Supabase

- O projeto Supabase remoto é somente leitura, salvo autorização explícita.
- Não execute SQL de alteração no Supabase remoto.
- Não altere schema, tabelas, policies, functions, triggers ou dados remotos.
- Todas as alterações de banco devem ocorrer no ambiente local.
- Não faça deploy de migrations para o Supabase remoto.

---

## 7. Produção e infraestrutura

- Não faça push diretamente para a branch de produção.
- Não faça merge diretamente na branch de produção.
- Trabalhe em branch própria.
- Não execute deploy em produção.
- Não altere configurações da Vercel.
- Não altere secrets, environment variables ou configurações de produção.
- Não altere pipelines de CI/CD sem autorização explícita.
- Não reinicie, pause ou remova recursos de produção.

### Git

- Não faça `git push` sem autorização explícita.
- Não faça `git reset --hard`.
- Não faça `git clean -fd`.
- Não reescreva histórico compartilhado.
- Não faça `rebase` de branches compartilhadas sem autorização.
- Não force push.
- Não apague branches remotas.
- Não altere commits existentes apenas para "organizar" o histórico.

---

## 8. Segurança

- Nunca coloque secrets, tokens, senhas ou chaves privadas no código.
- Nunca copie credenciais para logs, documentação ou mensagens.
- Não desative mecanismos de segurança para contornar um problema.
- Não desative autenticação, autorização, CORS, RLS ou validações apenas
  para facilitar desenvolvimento.
- Não reduza uma proteção de segurança sem autorização explícita.
- Não execute comandos destrutivos sem confirmar seu impacto.
- Não envie dados do projeto para serviços externos sem autorização.

---

## 9. Arquivos e configuração

- Não altere `.env`, secrets ou arquivos equivalentes sem necessidade.
- Não substitua configurações locais por configurações de produção.
- Não reformate arquivos inteiros sem necessidade.
- Não altere arquivos gerados automaticamente manualmente quando houver
  uma fonte de geração oficial.
- Não sobrescreva arquivos existentes sem verificar o impacto.
- Não apague arquivos apenas porque parecem não utilizados.

---

## 10. Documentação

- Não invente documentação.
- Não altere documentação normativa apenas para justificar uma implementação.
- Não transforme uma decisão do agente em documentação oficial.
- Quando uma documentação estiver desatualizada ou contraditória, informe o
  problema em vez de "corrigi-la" automaticamente.
- Documentação normativa deve ser alterada somente quando isso fizer parte
  da tarefa ou houver autorização explícita.

---

## 11. Conflitos entre fontes

Quando houver conflito, siga esta ordem:

1. Instruções explícitas do usuário para a tarefa atual.
2. ADRs existentes.
3. Especificações em `docs/specs/`.
4. PRD.
5. Contratos e documentação oficial do projeto.
6. Código existente.
7. Convenções e preferências gerais.

Se a aplicação dessa ordem não resolver o conflito:

- não escolha por conta própria;
- explique o conflito;
- apresente as opções;
- pare e aguarde decisão.

---

## 12. Condições obrigatórias para parar

O agente deve parar e pedir orientação quando:

- faltar uma decisão de produto;
- faltar uma regra de negócio;
- houver conflito entre documentos normativos;
- uma alteração necessária estiver fora do escopo;
- for necessário adicionar uma nova dependência não autorizada;
- for necessário alterar arquitetura;
- for necessário modificar infraestrutura de produção;
- for necessário alterar o banco remoto;
- um teste obrigatório falhar sem causa claramente resolvida;
- a especificação não permitir determinar o comportamento correto;
- houver risco significativo de perda ou corrupção de dados.

---

## 13. Regra de ouro

> Implemente somente o que foi especificado, dentro do escopo autorizado,
> usando as decisões já aprovadas.
>
> Quando uma decisão precisar ser tomada pelo time, não decida pelo time.
>
> Quando houver dúvida, pare, explique a dúvida e aguarde.