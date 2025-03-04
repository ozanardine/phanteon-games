-- Script para ajustar políticas RLS (Row-Level Security) no Supabase usando service_role
-- Esse script usa uma abordagem mais segura, usando o service_role do Supabase para acesso administrativo

-- 1. Primeiro, vamos verificar e remover políticas RLS existentes na tabela "users" se necessário
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON "public"."users";
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON "public"."users";
DROP POLICY IF EXISTS "Usuários autenticados podem inserir" ON "public"."users";

-- 2. Criar políticas RLS mais restritivas e seguras
-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" ON "public"."users"
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Política para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON "public"."users"
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Verificar se a tabela tem RLS habilitado
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para a tabela de subscriptions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias subscriptions" ON "public"."subscriptions";
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias subscriptions" ON "public"."subscriptions";

-- Política para permitir que usuários vejam apenas suas próprias assinaturas
CREATE POLICY "Usuários podem ver suas próprias subscriptions" ON "public"."subscriptions"
FOR SELECT 
TO authenticated
USING (user_id IN (
  SELECT id FROM users WHERE auth.uid() = id
));

-- 5. Verificar se a tabela subscriptions tem RLS habilitado
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

-- 6. Adicionar permissões para a tabela "payments" se necessário
DROP POLICY IF EXISTS "Usuários podem ver seus próprios payments" ON "public"."payments";

-- Política para permitir que usuários vejam apenas seus próprios pagamentos
CREATE POLICY "Usuários podem ver seus próprios payments" ON "public"."payments"
FOR SELECT 
TO authenticated
USING (user_id IN (
  SELECT id FROM users WHERE auth.uid() = id
));

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Com esta configuração, suas APIs precisarão usar o Client Supabase com a service_role
-- que permite contornar as políticas RLS. Adicione um comentário abaixo explicando essa abordagem:

COMMENT ON TABLE "public"."users" IS 'Tabela com políticas RLS restritivas. APIs que manipulam usuários devem usar service_role';
COMMENT ON TABLE "public"."subscriptions" IS 'Tabela com políticas RLS restritivas. APIs que manipulam assinaturas devem usar service_role';
COMMENT ON TABLE "public"."payments" IS 'Tabela com políticas RLS restritivas. APIs que manipulam pagamentos devem usar service_role';

-- Mensagem para garantir que o script foi executado completamente
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS atualizadas para usar service_role. Certifique-se de atualizar seu código para usar service_role nas APIs';
END $$;
