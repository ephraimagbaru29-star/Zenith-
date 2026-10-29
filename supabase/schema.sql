-- ============================================================
-- Zenith Bank — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. USERS
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,   -- bcrypt hash, set via your backend seed script
  created_at    timestamptz default now()
);

-- 2. ACCOUNTS  (one per user for now)
create table if not exists public.accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  account_number text not null unique,
  account_type   text not null default 'Checking',  -- 'Checking' | 'Savings'
  balance        numeric(14, 2) not null default 0,
  currency       text not null default 'USD',
  created_at     timestamptz default now()
);

-- 3. TRANSACTIONS
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.accounts(id) on delete cascade,
  type         text not null check (type in ('credit', 'debit')),
  description  text not null,
  amount       numeric(14, 2) not null,
  balance_after numeric(14, 2) not null,  -- running balance snapshot
  created_at   timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_accounts_user_id        on public.accounts(user_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);

-- ── Row Level Security ────────────────────────────────────────
-- The backend uses the service-role key which bypasses RLS.
-- Enable RLS anyway so direct client access stays locked down.
alter table public.users       enable row level security;
alter table public.accounts    enable row level security;
alter table public.transactions enable row level security;

-- ── Seed data (demo accounts) ─────────────────────────────────
-- password_hash below = bcrypt of "password123" (cost 10)
insert into public.users (id, name, email, password_hash) values
  ('00000000-0000-0000-0000-000000000001', 'Alex Johnson',  'alex@zenith.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('00000000-0000-0000-0000-000000000002', 'Maria Garcia',  'maria@zenith.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
on conflict (email) do nothing;

insert into public.accounts (id, user_id, account_number, account_type, balance, currency) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ZNT-0042-8871', 'Checking', 24530.75, 'USD'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'ZNT-0091-3345', 'Savings',   8210.00, 'USD')
on conflict (account_number) do nothing;

insert into public.transactions (account_id, type, description, amount, balance_after, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'credit', 'Salary Deposit',  5000.00, 24530.75, '2026-09-20 09:00:00+00'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'debit',  'Rent Payment',    1500.00, 19530.75, '2026-09-18 10:00:00+00'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'debit',  'Grocery Store',    120.50, 21030.75, '2026-09-15 14:30:00+00'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'credit', 'Freelance Work',   800.00, 21151.25, '2026-09-10 11:00:00+00'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'debit',  'Utility Bill',     200.00, 20351.25, '2026-09-05 08:00:00+00'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'credit', 'Transfer In',     2000.00,  8210.00, '2026-09-22 16:00:00+00'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'debit',  'Online Purchase',   89.99,  6210.00, '2026-09-19 20:00:00+00');
