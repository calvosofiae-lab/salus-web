-- Obras sociales específicas que acepta cada profesional (texto libre, el profesional las
-- tipea una por una), independiente del flag general "obra_social" en `coverage`. Mismo patrón
-- que `consultation_reasons`: array de texto, sin tabla de referencia.
alter table public.professionals
  add column health_insurances text[] not null default '{}';
