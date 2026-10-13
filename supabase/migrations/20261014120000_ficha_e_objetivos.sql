-- Ficha do paciente (só a Admin vê), objetivos terapêuticos gerais e objetivo combinado
-- na sessão para cada semana (a Admin escreve, o paciente lê).

-- ---------------------------------------------------------------------------
-- Ficha: dados de cadastro e histórico clínico. O paciente NÃO tem acesso.
-- ---------------------------------------------------------------------------
create table public.fichas_pacientes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  whatsapp text check (char_length(whatsapp) <= 30),
  inicio_acompanhamento date not null default current_date,
  historico text check (char_length(historico) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fichas_pacientes enable row level security;

create policy fichas_pacientes_select_admin on public.fichas_pacientes
  for select to authenticated using ((select private.is_admin()));
create policy fichas_pacientes_insert_admin on public.fichas_pacientes
  for insert to authenticated with check ((select private.is_admin()));
create policy fichas_pacientes_update_admin on public.fichas_pacientes
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Objetivos terapêuticos gerais (um texto por paciente)
-- ---------------------------------------------------------------------------
create table public.objetivos_terapeuticos (
  user_id uuid primary key references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) <= 4000),
  updated_at timestamptz not null default now()
);

alter table public.objetivos_terapeuticos enable row level security;

create policy objetivos_terapeuticos_select_own on public.objetivos_terapeuticos
  for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy objetivos_terapeuticos_insert_admin on public.objetivos_terapeuticos
  for insert to authenticated with check ((select private.is_admin()));
create policy objetivos_terapeuticos_update_admin on public.objetivos_terapeuticos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy objetivos_terapeuticos_delete_admin on public.objetivos_terapeuticos
  for delete to authenticated using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Objetivo da semana combinado na sessão
-- ---------------------------------------------------------------------------
create table public.objetivos_semana (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  semana_inicio date not null,
  texto text not null check (char_length(texto) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, semana_inicio)
);

alter table public.objetivos_semana enable row level security;

create policy objetivos_semana_select_own on public.objetivos_semana
  for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy objetivos_semana_insert_admin on public.objetivos_semana
  for insert to authenticated with check ((select private.is_admin()));
create policy objetivos_semana_update_admin on public.objetivos_semana
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy objetivos_semana_delete_admin on public.objetivos_semana
  for delete to authenticated using ((select private.is_admin()));

create trigger fichas_pacientes_updated_at before update on public.fichas_pacientes
  for each row execute function public.set_updated_at();
create trigger objetivos_terapeuticos_updated_at before update on public.objetivos_terapeuticos
  for each row execute function public.set_updated_at();
create trigger objetivos_semana_updated_at before update on public.objetivos_semana
  for each row execute function public.set_updated_at();
