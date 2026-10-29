-- O objetivo da semana passa a ser escrito só pela psicóloga (objetivos_semana).
-- Remove o objetivo que o paciente escrevia na reflexão semanal, inclusive o histórico (decisão de 29/10/2026).
alter table public.reflexoes_semanais drop column objetivo;
