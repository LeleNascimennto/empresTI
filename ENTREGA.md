# EmpresTI — entrega da prática SDD e subagentes

Data do registro: 11/11/2026.

**Situação: entrega parcial.** Há código preparado e uma demonstração com dados
fictícios. A aplicação real ainda depende de migrations, carga de equipamentos,
imagens e validação integrada. Este documento não certifica funcionamento em produção.

## Objetivo e tecnologia

Substituir a planilha de equipamentos internos por um catálogo com controle de
empréstimos por colaborador e acompanhamento por Operações. A prática exercita
especificação antes da implementação (SDD), revisão por subagente e uma skill
para preparar imagens dos equipamentos.

Stack: Next.js App Router, TypeScript, tRPC, Prisma, PostgreSQL/Supabase,
Supabase Auth, TanStack Query e Tailwind. Referências: [PRD](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/docs/PRD.md),
[ADR de stack](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/docs/adr/001-stack.md) e [Nocturne](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/layout.md).

## Conflitos e decisões aprovadas

| Tema | Alternativas ou conflito | Decisão |
|---|---|---|
| Limite | PRD original: 3; briefing: 5 | Cinco pedidos pendentes + empréstimos ativos por pessoa |
| Prazo | 14 dias corridos ou úteis | 14 dias úteis a partir da retirada, excluindo fins de semana e feriados nacionais brasileiros |
| TI-0010 | Briefing: disponível; lista: manutenção | Manutenção, junto de TI-0004 e TI-0007 |
| Imagens | Enunciado original: Pexels | Pixabay, conforme mudança solicitada pela usuária por orientação do professor |
| Cancelamento | Empréstimo imediato ou pedido pendente | Pedido pendente cancelável antes da retirada |
| Retirada | Operações ou colaborador | Colaborador confirma em “Meus empréstimos” |
| Expiração | Sem prazo definido no briefing | Após 24 horas úteis exatas; calendário de São Paulo, sem fins de semana e feriados nacionais |
| Seed | `seed.mjs` ou `seed.ts` | Implementação canônica em `prisma/seed.ts`; entrada `.mjs` de compatibilidade |
| Chave Pixabay | Todas as variáveis na Vercel ou ferramenta local | Exceção local autorizada; `PIXABAY_API_KEY` não precisa ir à Vercel |
| Processamento de imagens | Dependência adicional | Sharp autorizado para gerar imagens 800 × 600 |

Detalhamento: [spec da prática](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/spec/pratica-sdd-subagentes.md) e
[spec dos empréstimos](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/spec/solicitar-emprestimo.md). Atraso bloqueia novos
pedidos; manutenção impede solicitação; os dados reais exigem isolamento por tenant.

## Artefatos preparados

| Entrega | Evidência no repositório | Estado |
|---|---|---|
| Fluxo SDD | [Regras](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/rules/spec-flow.md), [spec da prática](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/spec/pratica-sdd-subagentes.md) | Documentado; aceite global ainda pendente |
| Subagente verificador | [Contrato](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/agents/verificador-spec.md) | Configurado para avaliar critérios e reportar falhas, sem corrigir nem operar em produção |
| Skill de imagens | [Skill Pixabay](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/skills/imagens-equipamentos/SKILL.md), [script](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/scripts/prepare-equipment-images.mjs) | Preparados; fotos reais ainda não carregadas ou revisadas |
| Dados iniciais | [Spec](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/spec/dados-iniciais.md), [seed](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/prisma/seed.ts) | Preparados para execução local; carga remota não concluída |
| Schema | [Prisma](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/prisma/schema.prisma), [migration](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/prisma/migrations/20261111000100_add_pending_loan_flow_and_equipment_images/migration.sql) | Versionados; aplicação remota pendente |
| Catálogo e pedidos | [Catálogo](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/src/components/equipment-catalog.tsx), [meus empréstimos](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/src/components/my-loans.tsx), [service](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/src/server/services/loans.ts) | Código preparado; validação integrada pendente |
| Workflow de migrations | [GitHub Actions](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/.github/workflows/prisma-migrations.yml), [instruções](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/docs/deploy-migrations.md) | Preparado; última tentativa de conexão falhou |
| Demonstração sem banco | [Página](app/demo/page.tsx), [spec](spec/demo-sem-banco.md) | Implementada e revisada pelo verificador |

Os 12 equipamentos previstos vão de TI-0001 a TI-0012: quatro notebooks,
três monitores, três cabos e duas câmeras. A demonstração inclui esses itens,
mas utiliza espaços reservados para imagens.

## Como apresentar a demonstração

1. Usar a branch `codex/demo-access`, enviada ao GitHub com o commit `1d6faa1`.
2. Com o projeto instalado, executar `npm run dev` e abrir
   `http://localhost:3000/demo` (ou a porta indicada no terminal).
3. Entrar com `nome.sobrenome@institutojef.org.br` e senha `inovação2026`.
   Também são aceitos outros e-mails no formato nome.sobrenome desse domínio.
4. Solicitar equipamento disponível, confirmar retirada, cancelar pedido
   pendente e simular devolução. A contagem limita a cinco itens.

A senha é apenas uma convenção de demonstração, visível no código cliente.
Ela não autentica no Supabase nem permite entrar nas rotas reais. Os dados
ficam na memória da página e desaparecem ao recarregar. Prazo, expiração e
isolamento de tenant do sistema real não são comprovados por esse mock.

O endereço publicado previsto é `https://empresti-delta.vercel.app/demo`,
**somente depois do merge e do deploy dessa branch**. A disponibilidade desse
endereço não foi confirmada neste registro.

## Verificações e evidências

Resultados registrados na sessão de desenvolvimento, antes desta documentação:

| Verificação | Resultado e limite |
|---|---|
| TypeScript (`tsc --noEmit`) | Passou |
| ESLint do projeto | Passou |
| Compilação (`next build --webpack`) | Passou; incluiu a rota `/demo` |
| Vitest | 11 testes passaram; 8 foram ignorados após falha de inicialização do ambiente de integração |
| Integração PostgreSQL | Suite falhou: `Could not find a working container runtime strategy`; Docker indisponível |
| Verificador da demo | Critérios atendidos; revisão somente de leitura e lint dos arquivos da demo/proxy |
| Banco remoto | Última consulta ao schema `public` retornou lista de tabelas vazia |
| GitHub | Push realizado; integração retornou 403 ao tentar reiniciar workflow e criar PR |

Código principal enviado na branch `codex/fix-nextjs-output-directory`:
`325dcd7` (demo) e `c7362c8` (catálogo, pedidos e migration preparados).
A branch isolada de demo permite revisar o mock sem incluir o fluxo real
dependente da migration.

Não há evidência consolidada da prova obrigatória de reprovação por erro
plantado. A aprovação da demo pelo verificador não substitui essa prova nem
aprova automaticamente as outras specs. Os testes e o build acima são
históricos; não foram repetidos para esta alteração exclusivamente documental.

## Pendências para o aceite completo

- [ ] Corrigir a conexão do workflow e aplicar as migrations pelo Prisma Migrate.
      Seguir as [instruções de migrations](https://github.com/LeleNascimennto/empresTI/blob/c7362c88b9afb86684182c1b8b9fae25a0836f51/docs/deploy-migrations.md); usar o
      Session pooler do mesmo projeto na porta 5432 quando o runner não alcançar IPv6.
- [ ] Obter e revisar as 12 imagens pela API Pixabay, registrar origem/licença
      e preparar os dados para carga. A chave não estava disponível neste checkout.
- [ ] Concluir a carga dos equipamentos pelo fluxo autorizado e validar o vínculo das imagens.
- [ ] Provisionar e validar o acesso real com usuário e membership no tenant correto.
- [ ] Finalizar cadastro de equipamentos, tela de Operações e devolução real.
- [ ] Rodar testes com PostgreSQL, isolamento de tenant e fluxos críticos de interface.
- [ ] Comprovar limite de cinco, bloqueio por atraso, manutenção, cancelamento,
      retirada, expiração e prazo útil no sistema integrado.
- [ ] Demonstrar a reprovação do verificador com erro proposital em fixture isolada,
      registrar a evidência e remover o erro antes da entrega.
- [ ] Obter os aceites finais das specs e publicar a versão real após validar o banco.

Nenhuma chave de API ou senha de produção deve acompanhar a entrega. A única
senha registrada acima pertence ao mock público com dados fictícios.
