# Diagnóstico de conexão com Supabase

## Objetivo
Verificar, sem alterar dados ou schema, se a aplicação local possui configuração suficiente para alcançar o Supabase e se o projeto configurado responde.

## Escopo
- Inspecionar nomes e formatos esperados de variáveis de ambiente sem exibir seus valores.
- Identificar o caminho de conexão usado pelo código existente.
- Fazer uma verificação remota somente de leitura quando houver configuração adequada.

## Restrições
- Não imprimir nem registrar chaves, senhas ou URLs de conexão completas.
- Não alterar dados, schema, políticas ou configuração remota.
- Não alterar arquivos de ambiente nem configurações do projeto.
- Não usar chave `service_role` para contornar políticas RLS.

## Critérios de aceite
- Informar quais variáveis necessárias estão presentes ou ausentes, somente pelos nomes.
- Distinguir configuração local, conectividade de rede e autenticação/autorização.
- Se possível, confirmar resposta do projeto Supabase por uma consulta simples e somente de leitura.
- Se não for possível validar a conexão real, explicar o limite e indicar passos seguros para concluir o diagnóstico.
