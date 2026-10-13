-- Schema inicial: perfis, consentimentos, check-ins diários, reflexões semanais
-- e registros de pensamento (TCC). Toda tabela com dado de paciente tem RLS.
-- A Admin (Bruna) apenas LÊ os dados dos pacientes; nunca edita o que o paciente registrou.

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'paciente' check (role in ('admin', 'paciente')),
  nome text not null default '',
  registro_pensamentos_ativo boolean not null default true,
  acompanhamento_encerrado_em date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Função usada pelas políticas para saber se quem pede é a Admin.
-- security definer evita recursão de RLS ao consultar profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()))
  with check ((select auth.uid()) = id or (select public.is_admin()));

-- O paciente só pode mudar o próprio nome. Papel, módulo TCC e encerramento
-- só mudam pela Admin (via Edge Function / painel), nunca pelo navegador do paciente.
revoke update on public.profiles from authenticated;
grant update (nome) on public.profiles to authenticated;

-- Perfil criado automaticamente quando um usuário é convidado/cadastrado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Consentimentos (LGPD) — histórico com data/hora, nunca sobrescrito
-- ---------------------------------------------------------------------------
create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('termos_de_uso', 'dado_saude')),
  versao text not null,
  aceito_em timestamptz not null default now(),
  revogado_em timestamptz
);

create index consentimentos_user_id_idx on public.consentimentos (user_id);
alter table public.consentimentos enable row level security;

create policy consentimentos_select_own on public.consentimentos
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy consentimentos_insert_own on public.consentimentos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Revogar = preencher revogado_em. Não há delete: o histórico de consentimento
-- é a prova legal e só some junto com a conta.
create policy consentimentos_update_own on public.consentimentos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke update on public.consentimentos from authenticated;
grant update (revogado_em) on public.consentimentos to authenticated;

-- Consentimento de dado de saúde vigente: exigido para gravar qualquer registro clínico.
create or replace function public.tem_consentimento_saude()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.consentimentos
    where user_id = (select auth.uid())
      and tipo = 'dado_saude'
      and revogado_em is null
  );
$$;

revoke execute on function public.tem_consentimento_saude() from public, anon;
grant execute on function public.tem_consentimento_saude() to authenticated;

-- ---------------------------------------------------------------------------
-- Check-in diário (Nível 1)
-- ---------------------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null default current_date,
  humor smallint not null check (humor between 1 and 5),
  emocao text not null check (emocao in ('alegria', 'ansiedade', 'tristeza', 'irritacao', 'medo', 'tranquilidade', 'outra')),
  emocao_outra text check (char_length(emocao_outra) <= 80),
  ansiedade smallint check (ansiedade between 1 and 5),
  sono_horas numeric(3, 1) check (sono_horas between 0 and 24),
  sono_qualidade smallint check (sono_qualidade between 1 and 5),
  energia smallint check (energia between 1 and 5),
  acontecimento text check (char_length(acontecimento) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

alter table public.checkins enable row level security;

create policy checkins_select_own on public.checkins
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy checkins_insert_own on public.checkins
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.tem_consentimento_saude()));

create policy checkins_update_own on public.checkins
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.tem_consentimento_saude()));

create policy checkins_delete_own on public.checkins
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Reflexão semanal sobre objetivos terapêuticos (Nível 1)
-- ---------------------------------------------------------------------------
create table public.reflexoes_semanais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  semana_inicio date not null,
  percepcao_avanco smallint check (percepcao_avanco between 1 and 5),
  avancos text check (char_length(avancos) <= 4000),
  dificuldades text check (char_length(dificuldades) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, semana_inicio)
);

alter table public.reflexoes_semanais enable row level security;

create policy reflexoes_semanais_select_own on public.reflexoes_semanais
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy reflexoes_semanais_insert_own on public.reflexoes_semanais
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.tem_consentimento_saude()));

create policy reflexoes_semanais_update_own on public.reflexoes_semanais
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.tem_consentimento_saude()));

create policy reflexoes_semanais_delete_own on public.reflexoes_semanais
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Registro de pensamentos — TCC (Nível 2, ativável por paciente)
-- ---------------------------------------------------------------------------
create table public.registros_pensamento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ocorrido_em timestamptz not null default now(),
  situacao text not null check (char_length(situacao) <= 2000),
  pensamento text not null check (char_length(pensamento) <= 2000),
  emocao text not null check (char_length(emocao) <= 80),
  intensidade smallint not null check (intensidade between 0 and 10),
  comportamento text check (char_length(comportamento) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index registros_pensamento_user_id_idx on public.registros_pensamento (user_id, ocorrido_em desc);
alter table public.registros_pensamento enable row level security;

-- Só grava se a Admin mantiver o módulo ativo para este paciente.
create or replace function public.registro_pensamentos_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select registro_pensamentos_ativo from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.registro_pensamentos_ativo() from public, anon;
grant execute on function public.registro_pensamentos_ativo() to authenticated;

create policy registros_pensamento_select_own on public.registros_pensamento
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy registros_pensamento_insert_own on public.registros_pensamento
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select public.tem_consentimento_saude())
    and (select public.registro_pensamentos_ativo())
  );

create policy registros_pensamento_update_own on public.registros_pensamento
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.tem_consentimento_saude()));

create policy registros_pensamento_delete_own on public.registros_pensamento
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger checkins_updated_at before update on public.checkins
  for each row execute function public.set_updated_at();
create trigger reflexoes_semanais_updated_at before update on public.reflexoes_semanais
  for each row execute function public.set_updated_at();
create trigger registros_pensamento_updated_at before update on public.registros_pensamento
  for each row execute function public.set_updated_at();
