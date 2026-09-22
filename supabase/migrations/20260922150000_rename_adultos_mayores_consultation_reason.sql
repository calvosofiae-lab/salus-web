-- Pedido del usuario 2026-09-22: renombrar el motivo de consulta "Adultos mayores" a "Persona
-- mayor" (y sumar 4 motivos nuevos, que no requieren migración de datos porque no existían
-- antes). `consultation_reasons` es texto libre sin tabla de referencia -- el array de opciones
-- vive solo en el código (features/professionals/constants.ts). Sin este update, los 49
-- profesionales que ya tenían "Adultos mayores" guardado quedarían con un valor que ya no
-- coincide con ninguna opción del formulario ni del buscador.

update public.professionals
set consultation_reasons = array_replace(consultation_reasons, 'Adultos mayores', 'Persona mayor')
where 'Adultos mayores' = any(consultation_reasons);
