-- Permite que a Admin ligue/desligue o registro de pensamentos de um paciente pelo painel.
-- A coluna passa a ser atualizável, mas um gatilho garante que só a Admin altere
-- este campo (o paciente continua podendo mudar apenas o próprio nome).
grant update (registro_pensamentos_ativo) on public.profiles to authenticated;

create or replace function private.somente_admin_altera_modulos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.registro_pensamentos_ativo is distinct from old.registro_pensamentos_ativo
     and auth.uid() is not null -- chamadas do servidor (SQL Editor, Edge Functions) não têm usuário
     and not private.is_admin() then
    raise exception 'Somente a psicóloga pode alterar os módulos do paciente.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

revoke execute on function private.somente_admin_altera_modulos() from public, anon, authenticated;

create trigger profiles_somente_admin_altera_modulos
  before update on public.profiles
  for each row execute function private.somente_admin_altera_modulos();
