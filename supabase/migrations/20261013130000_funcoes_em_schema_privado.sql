-- Move as funções auxiliares das políticas para um schema não exposto pela API REST,
-- para que não possam ser chamadas diretamente via /rest/v1/rpc.
-- As políticas referenciam a função pelo OID, então continuam funcionando após o move.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_admin() set schema private;
alter function public.tem_consentimento_saude() set schema private;
alter function public.registro_pensamentos_ativo() set schema private;
alter function public.handle_new_user() set schema private;
