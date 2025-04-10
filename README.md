# Phanter Ops

Este é o site oficial da Phanter Ops, uma plataforma para servidores de jogos online com sistema de assinatura VIP.

## Tecnologias Utilizadas

- **Next.js 14** - Framework React com suporte a Server Side Rendering e API Routes
- **TypeScript** - Superset de JavaScript com tipagem estática
- **Tailwind CSS** - Framework CSS utilitário para estilização
- **Supabase** - Banco de dados e autenticação
- **Mercado Pago API** - Processamento de pagamentos
- **Battlemetrics API** - Informações em tempo real dos servidores de jogos

## Estrutura do Projeto

```
phanter-ops/
├── src/
│   ├── app/               # Rotas e páginas da aplicação
│   │   ├── api/           # Routes handlers para API
│   │   ├── registro/      # Página de registro
│   │   ├── planos/        # Página de planos VIP
│   │   ├── servidores/    # Página de servidores
│   │   ├── globals.css    # Estilos globais
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Página inicial
│   ├── components/        # Componentes React
│   │   ├── layout/        # Componentes de layout (header, footer)
│   │   ├── ui/            # Componentes de UI reutilizáveis
│   │   └── ...            # Outros componentes
│   ├── lib/               # Utilitários e funções
│   │   ├── supabase/      # Cliente e funções do Supabase
│   │   └── api/           # Funções para consumo de APIs
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # Contextos React
│   └── types/             # Definições de tipos TypeScript
└── ...
```

## Funcionalidades Principais

1. **Autenticação de Usuários**
   - Registro de conta
   - Login/Logout
   - Perfil de usuário

2. **Visualização de Servidores**
   - Status em tempo real via Battlemetrics API
   - Informações detalhadas sobre cada servidor

3. **Sistema de Assinatura VIP**
   - Diferentes planos disponíveis
   - Pagamento via Mercado Pago
   - Gerenciamento de benefícios VIP

## Requisitos

- Node.js 18.0.0 ou superior
- NPM 8.0.0 ou superior

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Mercado Pago
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica_do_mercado_pago
MERCADO_PAGO_ACCESS_TOKEN=seu_token_de_acesso_do_mercado_pago

# Battlemetrics
NEXT_PUBLIC_BATTLEMETRICS_API_KEY=sua_chave_api_do_battlemetrics

# Configuração do site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Instalação e Execução

1. Clone o repositório
```
git clone https://github.com/seu-usuario/phanter-ops.git
cd phanter-ops
```

2. Instale as dependências
```
npm install
```

3. Execute o servidor de desenvolvimento
```
npm run dev
```

4. Acesse http://localhost:3000

## Configuração do Supabase

O projeto utiliza o Supabase como banco de dados e solução de autenticação. Siga estas etapas para configurar:

1. Crie uma conta no Supabase e um novo projeto
2. Configure as seguintes tabelas:
   - `profiles`: Armazena informações dos usuários
   - `subscriptions`: Gerencia assinaturas VIP
   - `payment_preferences`: Histórico de pagamentos

## Implantação

Este projeto está configurado para implantação na Vercel:

1. Faça push do seu código para um repositório no GitHub
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente
4. Implante

## Cores do Tema

O projeto segue a seguinte paleta de cores:

- Verde Militar Escuro: `#1E2B13`
- Verde Oliva Médio: `#4A5B2B`
- Laranja Intenso: `#F47B20`
- Preto/Preto-esverdeado: `#101810`

## Licença

Este projeto é proprietário da Phanter Ops. Todos os direitos reservados.

## Contato

Para mais informações, entre em contato pelo email: contato@phanterops.com 