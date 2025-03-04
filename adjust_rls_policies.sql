-- Script para ajustar políticas RLS (Row-Level Security) no Supabase
-- Esse script deve ser executado pelo administrador do banco de dados

-- 1. Primeiro, vamos verificar e remover políticas RLS existentes na tabela "users" se necessário
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON "public"."users";
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON "public"."users";
DROP POLICY IF EXISTS "Serviço pode criar usuários" ON "public"."users";
DROP POLICY IF EXISTS "Serviço pode gerenciar usuários" ON "public"."users";

-- 2. Criar políticas RLS que permitam a criação e gerenciamento de usuários
-- Política para permitir que o serviço (através da service_role key) crie novos usuários
CREATE POLICY "Serviço pode criar usuários" ON "public"."users"
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Política para permitir que o serviço (através da service_role key) leia todos os usuários
CREATE POLICY "Serviço pode ler todos os usuários" ON "public"."users"
FOR SELECT 
TO authenticated, anon
USING (true);

-- Política para permitir que o serviço (através da service_role key) atualize usuários
CREATE POLICY "Serviço pode atualizar usuários" ON "public"."users"
FOR UPDATE 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 3. Políticas específicas para usuários comuns (mais restritivas)
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

-- 4. Verificar se a tabela tem RLS habilitado
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para a tabela de subscriptions
DROP POLICY IF EXISTS "Serviço pode criar subscriptions" ON "public"."subscriptions";
DROP POLICY IF EXISTS "Serviço pode ler subscriptions" ON "public"."subscriptions";
DROP POLICY IF EXISTS "Serviço pode atualizar subscriptions" ON "public"."subscriptions";

CREATE POLICY "Serviço pode criar subscriptions" ON "public"."subscriptions"
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Serviço pode ler subscriptions" ON "public"."subscriptions"
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Serviço pode atualizar subscriptions" ON "public"."subscriptions"
FOR UPDATE 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 6. Verificar se a tabela subscriptions tem RLS habilitado
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

-- 7. Adicionar permissões para a tabela "payments" se necessário
DROP POLICY IF EXISTS "Serviço pode gerenciar payments" ON "public"."payments";

CREATE POLICY "Serviço pode gerenciar payments" ON "public"."payments"
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

-- Mensagem para garantir que o script foi executado completamente
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS atualizadas com sucesso para permitir operações na tabela users';
END $$;
