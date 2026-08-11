-- Investigación de costos (2026-08-11): "Cached Egress" de Supabase excedió los 5GB
-- incluidos (54GB). Causa: las fotos de perfil se subían tal cual las saca el celular
-- (hasta 5MB, sin resize) y se sirven con <img> plano sin optimización de Next.js -- cada
-- visita a la home/buscador descarga esas fotos a tamaño completo.
--
-- ProfessionalForm.tsx ahora redimensiona/comprime la foto en el navegador antes de subirla
-- (features/professionals/lib/photo.ts): un avatar de 480px en JPEG calidad 82% pesa
-- decenas de KB. Este límite del bucket es la defensa server-side de esa compresión
-- client-side -- igual que ya advertía 20260801091000_restrict_professional_photos_bucket.sql,
-- un llamado directo a la API de Storage se saltea cualquier chequeo del navegador.
--
-- No reduce el peso de las fotos ya subidas: esas quedan igual hasta que cada profesional
-- vuelva a subir la suya (que ahora sale comprimida sola).

update storage.buckets
set file_size_limit = 1048576 -- 1MB
where id = 'professional-photos';
