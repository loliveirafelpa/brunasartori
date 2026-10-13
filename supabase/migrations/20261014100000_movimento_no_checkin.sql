-- "Você se movimentou hoje?" (Sim/Não) no check-in diário. Opcional: nulo = não respondeu.
alter table public.checkins add column exercicio boolean;
