-- Anotações clínicas (diário da psicóloga) e medicações do paciente.
-- Ambas são exclusivas da Admin: o paciente não lê nem grava.

create table public.anotacoes_clinicas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade, -- paciente a quem a anotação se refere
  data date not null default current_date,
  texto text not null check (char_length(texto) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index anotacoes_clinicas_user_id_idx on public.anotacoes_clinicas (user_id, data desc);
alter table public.anotacoes_clinicas enable row level security;

create policy anotacoes_clinicas_select_admin on public.anotacoes_clinicas
  for select to authenticated using ((select private.is_admin()));
create policy anotacoes_clinicas_insert_admin on public.anotacoes_clinicas
  for insert to authenticated with check ((select private.is_admin()));
create policy anotacoes_clinicas_update_admin on public.anotacoes_clinicas
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy anotacoes_clinicas_delete_admin on public.anotacoes_clinicas
  for delete to authenticated using ((select private.is_admin()));

create table public.medicacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),
  dosagem text check (char_length(dosagem) <= 60),
  posologia text check (char_length(posologia) <= 200),
  prescrito_por text check (char_length(prescrito_por) <= 120),
  inicio date,
  fim date, -- nulo = em uso
  observacoes text check (char_length(observacoes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fim is null or inicio is null or fim >= inicio)
);

create index medicacoes_user_id_idx on public.medicacoes (user_id);
alter table public.medicacoes enable row level security;

create policy medicacoes_select_admin on public.medicacoes
  for select to authenticated using ((select private.is_admin()));
create policy medicacoes_insert_admin on public.medicacoes
  for insert to authenticated with check ((select private.is_admin()));
create policy medicacoes_update_admin on public.medicacoes
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy medicacoes_delete_admin on public.medicacoes
  for delete to authenticated using ((select private.is_admin()));

create trigger anotacoes_clinicas_updated_at before update on public.anotacoes_clinicas
  for each row execute function public.set_updated_at();
create trigger medicacoes_updated_at before update on public.medicacoes
  for each row execute function public.set_updated_at();
