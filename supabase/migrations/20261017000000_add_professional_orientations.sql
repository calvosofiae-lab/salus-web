-- Orientaciones terapéuticas que trabaja cada psicólogo/a (psicoanálisis, sistémica, etc.).
-- Mismo patrón que `consultation_reasons`: array de texto con los valores de una lista fija
-- definida en la app (features/professionals/constants.ts), sin tabla de referencia.
--
-- Solo aplica a profession = 'psicologo': el formulario la oculta y la vacía para psiquiatras,
-- y el buscador de la home solo ofrece el filtro cuando se elige Psicólogo/a.
alter table public.professionals
  add column orientations text[] not null default '{}';
