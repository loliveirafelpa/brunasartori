-- Comentários da psicóloga em cada tópico do Resumo (síntese e temas). Só a Admin vê.
create table public.comentarios_resumo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade, -- paciente
  topico text not null check (char_length(topico) between 1 and 40),
  data date not null default current_date,
  texto text not null check (char_length(texto) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comentarios_resumo_user_id_idx on public.comentarios_resumo (user_id, data desc);
alter table public.comentarios_resumo enable row level security;

create policy comentarios_resumo_select_admin on public.comentarios_resumo
  for select to authenticated using ((select private.is_admin()));
create policy comentarios_resumo_insert_admin on public.comentarios_resumo
  for insert to authenticated with check ((select private.is_admin()));
create policy comentarios_resumo_update_admin on public.comentarios_resumo
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy comentarios_resumo_delete_admin on public.comentarios_resumo
  for delete to authenticated using ((select private.is_admin()));

create trigger comentarios_resumo_updated_at before update on public.comentarios_resumo
  for each row execute function public.set_updated_at();
