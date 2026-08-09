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
  blocked_at timestamptz
);

-- Se você já rodou esse script antes (banco já existia), rode também estas duas linhas
-- pra adicionar as colunas novas sem perder os dados:
-- alter table users add column if not exists trial_ends_at timestamptz;
-- alter table users add column if not exists blocked_at timestamptz;

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

create index if not exists idx_users_status on users(status);
create index if not exists idx_reset_tokens_hash on password_reset_tokens(token_hash);
create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_ticket_messages_ticket on ticket_messages(ticket_id);

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
