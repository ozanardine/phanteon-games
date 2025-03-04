-- Script para adicionar a coluna 'role' à tabela 'users'
-- Execute este SQL no editor SQL do Supabase para adicionar a coluna role

-- Adicionar a coluna role se ela ainda não existir
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.users.role IS 'Papel do usuário no sistema (user, vip, vip-plus, admin)';

-- Atualizar usuários existentes para terem o papel padrão 'user'
UPDATE public.users SET role = 'user' WHERE role IS NULL;

-- Criar um índice para consultas mais rápidas por role
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Garantir que o trigger existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'users_updated_at_trigger' 
    AND tgrelid = 'public.users'::regclass
  ) THEN
    CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Verificar se a coluna role foi adicionada
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE 'Coluna role foi adicionada com sucesso à tabela users';
  ELSE
    RAISE EXCEPTION 'Falha ao adicionar coluna role à tabela users';
  END IF;
END
$$;
