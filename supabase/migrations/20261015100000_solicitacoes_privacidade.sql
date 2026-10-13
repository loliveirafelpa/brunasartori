-- Pedidos do paciente sobre os próprios dados (LGPD), que a psicóloga acompanha no painel.
-- Hoje: pedido de encerramento da conta. O paciente cria e vê os próprios pedidos;
-- a Admin vê todos e marca como resolvidos.
create table public.solicitacoes_privacidade (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('encerrar_conta')),
  mensagem text check (char_length(mensagem) <= 2000),
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

create index solicitacoes_privacidade_user_id_idx on public.solicitacoes_privacidade (user_id);
alter table public.solicitacoes_privacidade enable row level security;

create policy solicitacoes_privacidade_select_own on public.solicitacoes_privacidade
  for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy solicitacoes_privacidade_insert_own on public.solicitacoes_privacidade
  for insert to authenticated with check ((select auth.uid()) = user_id and resolvido_em is null);
create policy solicitacoes_privacidade_update_admin on public.solicitacoes_privacidade
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- A Admin só altera a data de resolução.
revoke update on public.solicitacoes_privacidade from authenticated;
grant update (resolvido_em) on public.solicitacoes_privacidade to authenticated;
