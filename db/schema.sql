-- Gestão de Lojas — schema Neon/Postgres
-- Rode esse script uma vez no seu banco Neon (SQL editor do console da Neon,
-- ou qualquer cliente Postgres apontando para o DATABASE_URL do projeto).

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  trial_ends_at timestamptz,
  blocked_at timestamptz,
  -- Contador usado pra "revogar" sessões: incrementado no logout (e na troca de senha), o
  -- token JWT guarda o valor de quando foi emitido — se não bater mais com o do banco, a
  -- sessão é rejeitada mesmo que o token em si ainda não tenha expirado (30 dias).
  token_version integer not null default 0,
  -- Atualizado toda vez que a pessoa abre o app (checagem de sessão em /api/me) — é o que
  -- alimenta a coluna "Último acesso" na aba Usuários.
  last_seen_at timestamptz
);

-- Se você já rodou esse script antes (banco já existia), rode também estas linhas
-- pra adicionar as colunas novas sem perder os dados:
-- alter table users add column if not exists trial_ends_at timestamptz;
-- alter table users add column if not exists blocked_at timestamptz;
-- alter table users add column if not exists token_version integer not null default 0;
-- alter table users add column if not exists last_seen_at timestamptz;

create table if not exists app_state (
  user_id uuid primary key references users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  subject text,
  message text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  sender text not null check (sender in ('user', 'admin')),
  message text not null,
  created_at timestamptz not null default now()
);

-- Registro de tentativas de login/cadastro/recuperação de senha, usado pra limitar força
-- bruta (rate limiting) por IP e por conta. Linhas antigas (> 24h) são apagadas sozinhas
-- de forma oportunista a cada checagem, então essa tabela não cresce sem parar.
create table if not exists auth_attempts (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('login', 'signup', 'forgot_password')),
  ip text not null,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_status on users(status);
create index if not exists idx_reset_tokens_hash on password_reset_tokens(token_hash);
create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_ticket_messages_ticket on ticket_messages(ticket_id);
create index if not exists idx_auth_attempts_scope_ip on auth_attempts(scope, ip, created_at);
create index if not exists idx_auth_attempts_scope_email on auth_attempts(scope, email, created_at);

-- Se o banco já existia antes dessa tabela, rode só isso (o create table if not exists
-- acima já cobre bancos novos):
-- create table if not exists ticket_messages (
--   id uuid primary key default gen_random_uuid(),
--   ticket_id uuid not null references tickets(id) on delete cascade,
--   sender text not null check (sender in ('user', 'admin')),
--   message text not null,
--   created_at timestamptz not null default now()
-- );
-- create index if not exists idx_ticket_messages_ticket on ticket_messages(ticket_id);
