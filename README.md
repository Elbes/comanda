# Comanda QR

Sistema de atendimento via QR Code para lanchonetes e bares. O cliente escaneia o QR Code da mesa, abre a comanda, faz pedidos em tempo real, e a conta pode ser fechada pelo cliente ou pela equipe.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUÇÃO                              │
│  Vercel (Next.js)  ←→  Supabase Cloud (Postgres/Auth/RT)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DESENVOLVIMENTO LOCAL                      │
│  Docker (Next.js app)  ←→  Supabase CLI (Docker containers) │
└─────────────────────────────────────────────────────────────┘
```

**Modelo de comercialização:** template reutilizável — cada cliente recebe sua própria instância isolada (projeto Supabase + projeto Vercel dedicados). Não é multi-tenant.

### Áreas do sistema

| Área | Acesso | Funções principais |
|------|--------|-------------------|
| **Cliente** | QR Code (sem login) | Abrir comanda, pedir, acompanhar status, solicitar conta |
| **Garçom** | Login e-mail/senha | Abrir comanda, lançar pedidos, bloquear mesa, fechar conta |
| **Balcão** | Login e-mail/senha | Pedidos em tempo real, status de preparo, esgotar itens |
| **Gerência** | Login e-mail/senha | Mesas/QR, cardápio, usuários, configurações, relatórios |

### Stack

- **Frontend/Backend:** Next.js 16 (App Router), Server Actions, API Routes
- **Banco:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (staff) + token de sessão em cookie (cliente)
- **Segurança:** Row Level Security (RLS) no Postgres
- **Tempo real:** Supabase Realtime
- **Estilo:** Tailwind CSS (mobile-first)
- **QR Code:** pacote `qrcode`

## Estrutura do projeto

```
comanda-qr/
├── docker-compose.yml          # App Next.js em container
├── Dockerfile.dev
├── supabase/
│   ├── config.toml
│   ├── migrations/             # Schema + RLS versionados
│   └── seed.sql                # Dados iniciais
├── src/
│   ├── app/
│   │   ├── mesa/[token]/         # Área do cliente
│   │   ├── garcom/               # Área do garçom
│   │   ├── balcao/               # Área do balcão
│   │   ├── gerencia/             # Área da gerência
│   │   └── login/
│   ├── components/               # UI por domínio
│   ├── hooks/                    # Realtime hooks
│   └── lib/
│       ├── actions/              # Server Actions (lógica de negócio)
│       ├── supabase/             # Clients (browser, server, admin)
│       └── types/
└── README.md
```

## Desenvolvimento local

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — **obrigatório e precisa estar aberto**
- [Node.js 20+](https://nodejs.org/) — para rodar scripts npm

> **Windows:** não é necessário instalar o Supabase CLI globalmente. Ele vem como dependência do projeto (`npx supabase`).

### Setup rápido (Windows)

Abra o **Docker Desktop** e aguarde iniciar. Depois, no PowerShell:

```powershell
cd C:\Users\elbes.souza\Documents\Projetos\comanda-qr
npm run setup
```

O script `setup.ps1` instala dependências, sobe o Supabase local e aplica migrations/seed.

Em seguida, inicie a app:

```powershell
npm run dev
```

Ou via Docker:

```powershell
docker compose up
```

### Comandos úteis

| Comando | O que faz |
|---------|-----------|
| `npm run setup` | Setup completo (primeira vez) |
| `npm run db:start` | Sobe Supabase local |
| `npm run db:reset` | Recria banco + seed |
| `npm run db:stop` | Para Supabase local |
| `npm run dev` | App Next.js (sem Docker) |
| `docker compose up` | App em container |

### 1. Subir o banco (Supabase local)

```bash
# Na raiz do projeto (nao precisa de CLI global)
npm run db:start
```

### 2. Aplicar migrations e seed

```bash
npm run db:reset
```

Isso aplica todas as migrations em `supabase/migrations/` e executa `supabase/seed.sql`.

### 3. Configurar variáveis de ambiente

O arquivo `.env.local` ja vem preenchido com as chaves padrao do Supabase local.
Se nao existir, copie:

```bash
cp .env.example .env.local
```

### 4. Subir a aplicação

**Opção A — Docker (recomendado):**

```bash
docker compose up
```

Acesse: http://localhost:3000

**Opção B — Node direto:**

```bash
npm install
npm run dev
```

### 5. Criar usuário de gerência

Acesse http://localhost:3000/gerencia/setup e crie o primeiro administrador.

Ou via Supabase Studio (http://127.0.0.1:54323):

1. Crie um usuário em Authentication
2. Execute no SQL Editor:

```sql
INSERT INTO system_users (auth_user_id, name, role)
VALUES ('<uuid-do-auth.users>', 'Administrador', 'gerencia');
```

### Fluxo de teste ponta a ponta

1. Login em `/login` como gerência
2. `/gerencia` → cadastrar mesas → gerar QR Code
3. Abrir `/mesa/{token}` no celular (ou nova aba)
4. Informar nome → abrir comanda → fazer pedido
5. Login como balcão em `/balcao` → ver pedido em tempo real
6. Avançar status do pedido
7. Fechar conta pelo garçom ou solicitar pelo cliente

## Provisionamento em produção (novo cliente)

Cada cliente recebe instâncias isoladas. Siga os passos abaixo para cada novo contrato:

### 1. Criar projeto Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New Project** → escolha região e senha do banco
3. Anote: `Project URL`, `anon key`, `service_role key`

### 2. Aplicar migrations

```bash
# Vincular ao projeto remoto
supabase link --project-ref <project-ref>

# Enviar migrations
supabase db push
```

Ou execute os SQLs manualmente no SQL Editor do Supabase.

### 3. Executar seed

No SQL Editor, execute o conteúdo de `supabase/seed.sql`.

### 4. Criar projeto Vercel

1. Acesse [vercel.com](https://vercel.com)
2. **Import** do repositório template
3. Configure as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `NEXT_PUBLIC_APP_URL` | Domínio do cliente (ex: `https://bar-cliente.vercel.app`) |

### 5. Deploy

O deploy ocorre automaticamente via integração Git. Ou:

```bash
vercel --prod
```

### 6. Configuração inicial

1. Acesse `https://<dominio>/gerencia/setup`
2. Crie o administrador
3. Configure estabelecimento, cardápio e mesas em `/gerencia`
4. Imprima os QR Codes em `/gerencia/mesas/imprimir`

### 7. Domínio customizado (opcional)

No painel Vercel: **Settings → Domains** → adicione o domínio/subdomínio do cliente.

Atualize `NEXT_PUBLIC_APP_URL` com o domínio final.

## Segurança

- **Cliente:** acesso via `anon key` + token de sessão em cookie httpOnly. RLS valida que cada pessoa só acessa sua comanda (`x-comanda-session` header).
- **Staff:** Supabase Auth + tabela `system_users` com papel (`garcom`, `balcao`, `gerencia`). Middleware protege rotas.
- **Operações sensíveis:** Server Actions com `service_role key` após validação server-side.
- **Auditoria:** cancelamentos, bloqueio de mesa e regeneração de token geram registro em `audit_logs`.

## Comandos úteis

```bash
npm run db:reset    # Resetar banco local (migrations + seed)
npm run db:stop     # Parar Supabase local
npm run build       # Build de produção
npm run lint        # Lint
```

## Licença

Projeto proprietário — template para comercialização por instância.
