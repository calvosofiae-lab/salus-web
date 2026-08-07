-- Pedido del cliente: los profesionales nuevos arrancan mostrando 5 estrellas (antes
-- arrancaban en 3, ver 20260801053303_default_professional_average_rating.sql). El
-- trigger trg_update_professional_average_rating sigue recalculando el promedio real
-- apenas entra la primera review, así que puede bajar de 5 con el tiempo.

alter table public.professionals
  alter column average_rating set default 5;
