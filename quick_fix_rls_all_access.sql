-- Script de solução rápida para problemas com RLS
-- ATENÇÃO: Este script define políticas que permitem acesso total às tabelas
-- Use apenas para testes ou temporariamente enquanto implementa uma solução mais segura

-- Desativar temporariamente RLS para permitir todas as operações
-- Comentado porque não é recomendado em produção, mas é uma solução rápida se necessário
-- ALTER TABLE "public"."users" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."subscriptions" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."payments" DISABLE ROW LEVEL SECURITY;

-- Abordagem alternativa: manter RLS ativado, mas criar políticas permissivas

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable all access for users" ON "public"."users";
DROP POLICY IF EXISTS "Enable all access for subscriptions" ON "public"."subscriptions";
DROP POLICY IF EXISTS "Enable all access for payments" ON "public"."payments";

-- Criar políticas que permitem todas as operações
CREATE POLICY "Enable all access for users" ON "public"."users"
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for subscriptions" ON "public"."subscriptions"
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for payments" ON "public"."payments"
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Verificar se RLS está habilitado nas tabelas
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

-- Adicionar aviso ao banco de dados
COMMENT ON TABLE "public"."users" IS 'ATENÇÃO: Políticas RLS permissivas aplicadas temporariamente';
COMMENT ON TABLE "public"."subscriptions" IS 'ATENÇÃO: Políticas RLS permissivas aplicadas temporariamente';
COMMENT ON TABLE "public"."payments" IS 'ATENÇÃO: Políticas RLS permissivas aplicadas temporariamente';

-- Mensagem para garantir que o script foi executado completamente
DO $$
BEGIN
  RAISE NOTICE 'AVISO: Políticas RLS permissivas aplicadas temporariamente. Considere implementar uma solução mais segura para produção.';
END $$;
