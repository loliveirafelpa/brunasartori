-- Gatilhos/situações associadas às emoções, registrados opcionalmente no check-in diário.
-- São situações percebidas pelo paciente, nunca tratadas como causas.
alter table public.checkins
  add column situacoes text[] not null default '{}'
    check (situacoes <@ array[
      'trabalho', 'familia', 'relacionamento', 'vida_social', 'financas', 'saude',
      'estudos', 'solidao', 'sobrecarga', 'mudanca_rotina', 'outra'
    ]::text[]),
  add column situacao_outra text check (char_length(situacao_outra) <= 80);
