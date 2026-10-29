-- Módulos e protocolos (validados na demo LOF Psi em 26–29/10/2026):
--   * a psicóloga liga módulos e questionários por paciente (profiles.modulos / profiles.escalas);
--   * o check-in guarda as respostas dos módulos ligados (checkins.modulos);
--   * questionários (EPDS, GAD-7), crises registradas e o "Responder mais tarde" do questionário;
--   * dia e horário fixo da consulta na ficha (só a Admin);
--   * origem legível das anotações do Resumo e dos Gráficos;
--   * registro de pensamentos disponível para todos os pacientes.

-- ---------------------------------------------------------------------------
-- Perfis: módulos e questionários ligados. Só a Admin altera (mesmo gatilho do encerramento).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column modulos jsonb not null default '{}'::jsonb
    check (jsonb_typeof(modulos) = 'object' and pg_column_size(modulos) <= 2000),
  add column escalas jsonb not null default '{}'::jsonb
    check (jsonb_typeof(escalas) = 'object' and pg_column_size(escalas) <= 2000);

grant update (modulos, escalas) on public.profiles to authenticated;

create or replace function private.somente_admin_altera_modulos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.registro_pensamentos_ativo is distinct from old.registro_pensamentos_ativo
      or new.acompanhamento_encerrado_em is distinct from old.acompanhamento_encerrado_em
      or new.modulos is distinct from old.modulos
      or new.escalas is distinct from old.escalas)
     and auth.uid() is not null -- chamadas do servidor (SQL Editor, Edge Functions) não têm usuário
     and not private.is_admin() then
    raise exception 'Somente a psicóloga pode alterar os módulos, os questionários ou o encerramento do paciente.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Check-in: respostas dos módulos, ex.: { "tabagismo": { "fumou": true, "quantidade": 8 } }
-- ---------------------------------------------------------------------------
alter table public.checkins
  add column modulos jsonb not null default '{}'::jsonb
    check (jsonb_typeof(modulos) = 'object' and pg_column_size(modulos) <= 8000);

-- ---------------------------------------------------------------------------
-- Registro de pensamentos para todos: deixa de depender do interruptor da Admin.
-- ---------------------------------------------------------------------------
drop policy registros_pensamento_insert_own on public.registros_pensamento;
create policy registros_pensamento_insert_own on public.registros_pensamento
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select private.tem_consentimento_saude()));

update public.profiles set registro_pensamentos_ativo = true where not registro_pensamentos_ativo;

-- ---------------------------------------------------------------------------
-- Questionários respondidos. A pontuação total é calculada no banco.
-- ---------------------------------------------------------------------------
create table public.questionarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('epds', 'gad7')),
  data date not null default current_date,
  respostas smallint[] not null
    check (respostas <@ array[0, 1, 2, 3]::smallint[] and array_position(respostas, null) is null),
  total smallint not null default 0,
  created_at timestamptz not null default now(),
  check ((tipo = 'epds' and cardinality(respostas) = 10) or (tipo = 'gad7' and cardinality(respostas) = 7))
);

create index questionarios_user_id_idx on public.questionarios (user_id, data desc);
alter table public.questionarios enable row level security;

create or replace function private.calcular_total_questionario()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.total := (select coalesce(sum(r), 0) from unnest(new.respostas) as r);
  return new;
end;
$$;

revoke execute on function private.calcular_total_questionario() from public, anon, authenticated;

create trigger questionarios_total before insert or update on public.questionarios
  for each row execute function private.calcular_total_questionario();

create policy questionarios_select_own on public.questionarios
  for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy questionarios_insert_own on public.questionarios
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select private.tem_consentimento_saude()));
create policy questionarios_update_own on public.questionarios
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select private.tem_consentimento_saude()));
create policy questionarios_delete_own on public.questionarios
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- "Responder mais tarde": o aviso do questionário some só até o dia seguinte.
-- ---------------------------------------------------------------------------
create table public.questionarios_adiados (
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('epds', 'gad7')),
  dia date not null,
  primary key (user_id, tipo)
);

alter table public.questionarios_adiados enable row level security;

create policy questionarios_adiados_select_own on public.questionarios_adiados
  for select to authenticated using ((select auth.uid()) = user_id);
create policy questionarios_adiados_insert_own on public.questionarios_adiados
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy questionarios_adiados_update_own on public.questionarios_adiados
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy questionarios_adiados_delete_own on public.questionarios_adiados
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Crises de ansiedade registradas pelo paciente (protocolo de crise).
-- ---------------------------------------------------------------------------
create table public.crises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ocorrido_em timestamptz not null default now(),
  intensidade smallint not null check (intensidade between 0 and 10),
  duracao smallint check (duracao in (5, 20, 45, 90)), -- minutos aproximados de cada faixa
  lugar text check (lugar in ('casa', 'trabalho', 'rua', 'transporte', 'lugar_cheio', 'outro')),
  sintomas text[] not null default '{}' check (sintomas <@ array[
    'coracao', 'ar', 'tontura', 'tremor', 'suor', 'peito', 'formigamento', 'enjoo', 'irrealidade', 'controle', 'morrer'
  ]::text[]),
  estrategias text[] not null default '{}' check (estrategias <@ array[
    'respiracao', 'aterramento', 'saiu', 'ligou', 'medicacao', 'agua', 'esperou'
  ]::text[]),
  ajudou text check (char_length(ajudou) <= 2000),
  created_at timestamptz not null default now()
);

create index crises_user_id_idx on public.crises (user_id, ocorrido_em desc);
alter table public.crises enable row level security;

create policy crises_select_own on public.crises
  for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy crises_insert_own on public.crises
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select private.tem_consentimento_saude()));
create policy crises_update_own on public.crises
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select private.tem_consentimento_saude()));
create policy crises_delete_own on public.crises
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Ficha: dia e horário fixo da consulta (só a Admin, como o resto da ficha).
-- { "diaSemana": 0–6 (0 = domingo), "hora": "HH:MM", "frequencia": "semanal" | "quinzenal", "referencia": "AAAA-MM-DD" | null }
-- ---------------------------------------------------------------------------
alter table public.fichas_pacientes
  add column consulta jsonb check (
    consulta is null or (
      jsonb_typeof(consulta) = 'object'
      and consulta ->> 'diaSemana' ~ '^[0-6]$'
      and consulta ->> 'hora' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and consulta ->> 'frequencia' in ('semanal', 'quinzenal')
      and (consulta ->> 'referencia' is null or consulta ->> 'referencia' ~ '^\d{4}-\d{2}-\d{2}$')
    )
  );

-- ---------------------------------------------------------------------------
-- Anotações nos tópicos: origem legível ("Gráficos · Humor (1 a 5)") e chaves de tópico mais longas.
-- ---------------------------------------------------------------------------
alter table public.comentarios_resumo
  add column origem text check (char_length(origem) <= 200);
alter table public.comentarios_resumo drop constraint comentarios_resumo_topico_check;
alter table public.comentarios_resumo add constraint comentarios_resumo_topico_check
  check (char_length(topico) between 1 and 80);
