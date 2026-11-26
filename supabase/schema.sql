-- ============================================================================
-- ANDMoz M&A — Plataforma NutriFamily + (Quelimane, Zambézia)
-- Esquema SQL para Supabase (PostgreSQL + RLS)
-- ============================================================================

-- 1. Perfis de Utilizadores (ligados a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  role text not null check (role in ('admin', 'gestor')),
  created_at timestamptz not null default now()
);

-- 2. Famílias Beneficiárias
create table if not exists public.familias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  chefe_agregado text not null,
  comunidade text not null,
  clube text not null,
  membros_agregado integer not null default 4,
  criancas_0_5 integer not null default 0,
  possui_pcd boolean not null default false,
  possui_idoso boolean not null default false,
  estado_horta text not null default 'Planeada',
  diversidade_alimentar boolean not null default false,
  grupo_poupanca boolean not null default false,
  multiplicador_responsavel text not null,
  estado_nutricional text not null default 'Estável',
  data_registo text not null,
  mes_registo integer not null default 1,
  observacoes text not null default '',
  validado_admin boolean not null default false,
  criado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Multiplicadores Comunitários
create table if not exists public.multiplicadores (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nome_completo text not null,
  telefone text not null,
  comunidade text not null,
  clube text not null,
  especialidade text not null default 'Nutrição Materno-Infantil',
  estado_formacao text not null default 'Em formação',
  visitas_domiciliarias integer not null default 0,
  triagens_muac integer not null default 0,
  casos_risco_encaminhados integer not null default 0,
  familias_atribuidas integer not null default 0,
  sessoes_realizadas integer not null default 0,
  estado text not null default 'Activo',
  observacoes text not null default '',
  validado_admin boolean not null default false,
  criado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4. Relatórios e Documentos de Actividades
create table if not exists public.documentos_atividades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null,
  data_atividade text not null,
  comunidade text not null,
  mes_projeto integer not null default 1,
  enviado_por text not null,
  perfil_envio text not null default 'Gestor de Projectos',
  nome_ficheiro text not null,
  mime_type text not null default 'text/plain',
  tamanho_bytes integer not null default 0,
  conteudo_base64 text not null,
  resumo text not null default '',
  estado text not null default 'Enviado',
  criado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.familias enable row level security;
alter table public.multiplicadores enable row level security;
alter table public.documentos_atividades enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Perfis: cada utilizador lê o seu próprio perfil (ou admin lê todos)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Famílias: utilizadores autenticados lêem e inserem; apenas admin actualiza ou remove
drop policy if exists "familias_select_auth" on public.familias;
create policy "familias_select_auth" on public.familias
  for select to authenticated using (true);

drop policy if exists "familias_insert_auth" on public.familias;
create policy "familias_insert_auth" on public.familias
  for insert to authenticated
  with check (public.is_admin() or validado_admin = false);

drop policy if exists "familias_update_admin" on public.familias;
create policy "familias_update_admin" on public.familias
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "familias_delete_admin" on public.familias;
create policy "familias_delete_admin" on public.familias
  for delete to authenticated
  using (public.is_admin());

-- Multiplicadores: utilizadores autenticados lêem e inserem; apenas admin actualiza ou remove
drop policy if exists "multiplicadores_select_auth" on public.multiplicadores;
create policy "multiplicadores_select_auth" on public.multiplicadores
  for select to authenticated using (true);

drop policy if exists "multiplicadores_insert_auth" on public.multiplicadores;
create policy "multiplicadores_insert_auth" on public.multiplicadores
  for insert to authenticated
  with check (public.is_admin() or validado_admin = false);

drop policy if exists "multiplicadores_update_admin" on public.multiplicadores;
create policy "multiplicadores_update_admin" on public.multiplicadores
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "multiplicadores_delete_admin" on public.multiplicadores;
create policy "multiplicadores_delete_admin" on public.multiplicadores
  for delete to authenticated
  using (public.is_admin());

-- Documentos de Actividades: utilizadores autenticados lêem e enviam; apenas admin actualiza ou remove
drop policy if exists "docs_select_auth" on public.documentos_atividades;
create policy "docs_select_auth" on public.documentos_atividades
  for select to authenticated using (true);

drop policy if exists "docs_insert_auth" on public.documentos_atividades;
create policy "docs_insert_auth" on public.documentos_atividades
  for insert to authenticated
  with check (true);

drop policy if exists "docs_update_admin" on public.documentos_atividades;
create policy "docs_update_admin" on public.documentos_atividades
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "docs_delete_admin" on public.documentos_atividades;
create policy "docs_delete_admin" on public.documentos_atividades
  for delete to authenticated
  using (public.is_admin());
