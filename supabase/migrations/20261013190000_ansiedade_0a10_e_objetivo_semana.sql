-- 1) Ansiedade/estresse no check-in passa de escala 1–5 para barra 0–10.
--    Registros antigos são convertidos multiplicando por 2 (1→2, 3→6, 5→10).
alter table public.checkins drop constraint checkins_ansiedade_check;
update public.checkins set ansiedade = ansiedade * 2 where ansiedade is not null;
alter table public.checkins add constraint checkins_ansiedade_check check (ansiedade between 0 and 10);

-- 2) Reflexão semanal ganha o "objetivo da semana".
alter table public.reflexoes_semanais
  add column objetivo text check (char_length(objetivo) <= 2000);
