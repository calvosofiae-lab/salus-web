-- Revisión de seguridad (2026-08-01): la validación de tipo/tamaño de foto en
-- uploadProfessionalPhoto (repositories/professionalsRepository.ts) y ProfessionalForm.tsx
-- es 100% client-side (chequeo de file.type/file.size en JS) y se salteaba con un llamado
-- directo a la API de Storage -- las policies de RLS del bucket (20260801060000_...sql) solo
-- validan bucket_id y ownership, nunca el contenido subido.
--
-- Storage soporta estos límites nativamente a nivel de bucket, sin necesidad de lógica extra
-- en las policies: se rechazan en la API antes de llegar a escribir el objeto.

update storage.buckets
set file_size_limit = 5242880, -- 5MB, mismo límite que ya exige el formulario
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'professional-photos';
