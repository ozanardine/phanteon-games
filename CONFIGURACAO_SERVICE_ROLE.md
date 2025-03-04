# Configuração da Service Role Key do Supabase

## O que é a Service Role Key?

A Service Role Key é uma chave de API do Supabase com permissões administrativas que contorna as políticas de segurança RLS (Row-Level Security). Essa chave deve ser usada **apenas** em operações do lado do servidor, nunca no código do lado do cliente.

## Por que precisamos dela?

Estamos enfrentando erros de permissão nas políticas RLS ao criar/atualizar usuários. O uso da Service Role Key permite que nossas APIs funcionem corretamente, contornando as restrições de RLS, enquanto mantemos a segurança.

## Como obter a Service Role Key

1. Acesse o [Dashboard do Supabase](https://app.supabase.io/)
2. Selecione seu projeto
3. Vá para **Configurações do Projeto** (ícone de engrenagem no canto inferior esquerdo)
4. Clique em **API** no menu lateral
5. Role para baixo até a seção **Project API keys**
6. Copie a chave **service_role key (secret)**

## Como configurar a Service Role Key

### Para desenvolvimento local:

1. Crie um arquivo `.env.local` na raiz do projeto (você pode copiar do `.env.local.example`)
2. Adicione a seguinte linha ao arquivo, substituindo `sua-chave` pela chave copiada:

```
SUPABASE_SERVICE_ROLE_KEY=sua-chave
```

### Para ambiente de produção (Vercel):

1. Acesse o [Dashboard da Vercel](https://vercel.com/)
2. Selecione seu projeto
3. Vá para **Settings** > **Environment Variables**
4. Adicione uma nova variável de ambiente:
   - Nome: `SUPABASE_SERVICE_ROLE_KEY`
   - Valor: `sua-chave`
5. Selecione todos os ambientes (Production, Preview, Development)
6. Clique em **Save**
7. Execute um novo deploy para aplicar as alterações

## IMPORTANTE: Medidas de Segurança

- **NUNCA** exponha a Service Role Key no código do lado do cliente
- **NUNCA** inclua a Service Role Key em repositórios Git públicos
- Use a Service Role Key apenas em APIs do lado do servidor
- Implemente validações adequadas em suas APIs para garantir que os usuários só possam acessar seus próprios dados

## Verificando a Configuração

Para verificar se a configuração está correta:

1. Reinicie o servidor de desenvolvimento após adicionar a variável de ambiente
2. Tente realizar um checkout para criar um novo usuário
3. Verifique os logs do servidor para confirmar que não há mais erros de violação de política RLS
