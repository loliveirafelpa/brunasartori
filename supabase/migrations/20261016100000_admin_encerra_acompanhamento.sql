-- Permite que a Admin marque (ou desfaça) o encerramento do acompanhamento de um paciente,
-- para separar ativos e encerrados no painel. Só organiza a lista: a conta e os registros
-- continuam como estão. O mesmo gatilho dos módulos passa a proteger também este campo.
grant update (acompanhamento_encerrado_em) on public.profiles to authenticated;

create or replace function private.somente_admin_altera_modulos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.registro_pensamentos_ativo is distinct from old.registro_pensamentos_ativo
      or new.acompanhamento_encerrado_em is distinct from old.acompanhamento_encerrado_em)
     and auth.uid() is not null -- chamadas do servidor (SQL Editor, Edge Functions) não têm usuário
     and not private.is_admin() then
    raise exception 'Somente a psicóloga pode alterar os módulos ou o encerramento do paciente.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
