# Solução para Problemas de RLS (Row-Level Security) no Phanteon Games

## Problema Identificado
Um erro está ocorrendo no processo de checkout:
```
Erro ao criar usuário: new row violates row-level security policy for table "users"
```

Este erro acontece porque as políticas de segurança em nível de linha (RLS) do Supabase estão impedindo que o código crie novos usuários ou atualize os existentes.

## Soluções Disponíveis

Forneci três abordagens diferentes para resolver o problema. Escolha a que melhor se adapta às suas necessidades:

### 1. Solução Equilibrada (Recomendada)
Arquivo: `adjust_rls_policies.sql`

Esta abordagem:
- Cria políticas que permitem operações necessárias
- Mantém algum nível de segurança
- Permite que seu código atual funcione sem grandes modificações

### 2. Solução mais Segura (Melhor para Produção)
Arquivos: 
- `adjust_rls_with_service_role.sql`
- `update_api_for_service_role.js`

Esta abordagem:
- Usa o service_role do Supabase para operações administrativas
- É mais segura e segue as melhores práticas
- Requer modificações em seu código para implementar corretamente

### 3. Solução Rápida Temporária (Apenas para Testes)
Arquivo: `quick_fix_rls_all_access.sql`

Esta abordagem:
- Cria políticas totalmente permissivas
- É a mais fácil de implementar
- Menos segura, use apenas para testes ou temporariamente

## Como Implementar

### Para a Solução 1 ou 3:
1. Acesse o painel do Supabase
2. Vá para SQL Editor
3. Cole e execute o conteúdo do arquivo SQL escolhido
4. Teste a aplicação

### Para a Solução 2 (mais segura):
1. Acesse o painel do Supabase
2. Vá para SQL Editor
3. Cole e execute o conteúdo do arquivo `adjust_rls_with_service_role.sql`
4. Modifique seu código seguindo as instruções em `update_api_for_service_role.js`
5. Adicione a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` ao seu projeto Vercel
6. Adicione a mesma variável ao seu arquivo `.env.local` para desenvolvimento

## Obter a Service Role Key

Para implementar a solução 2, você precisará da Service Role Key do Supabase:

1. Acesse o Dashboard do Supabase
2. Vá para Project Settings > API
3. Encontre a "service_role key" (é secreta, não compartilhe publicamente)
4. Use essa chave como valor para `SUPABASE_SERVICE_ROLE_KEY`

## Considerações de Segurança

- A service_role key tem permissões administrativas completas
- Nunca exponha a service_role key no navegador ou código do lado do cliente
- Use a service_role apenas em APIs do lado do servidor
- Mesmo com service_role, implemente validações em suas APIs

## Solução Recomendada

Para a maioria dos casos, recomendamos a Solução 2 (usando service_role), mas você pode começar com a Solução 1 se precisar de uma implementação mais rápida.

A Solução 3 deve ser usada apenas para testes ou temporariamente.

---

Se precisar de mais ajuda ou tiver dúvidas, entre em contato!
