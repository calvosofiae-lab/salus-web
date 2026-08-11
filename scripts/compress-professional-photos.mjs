// Script de mantenimiento único: recomprime las fotos de perfil ya subidas al bucket
// professional-photos (antes se subían tal cual las saca el celular, hasta 5MB, sin resize
// -- eso disparó el excedente de "Cached Egress" en Supabase). ProfessionalForm.tsx ya
// comprime las fotos nuevas del lado del cliente (features/professionals/lib/photo.ts); esto
// aplica la misma transformación (480px de lado más largo, JPEG calidad 82%) a lo que ya
// estaba en el bucket.
//
// Por default corre en modo dry-run (no escribe nada, solo reporta qué haría). Pasar --apply
// para efectivamente sobrescribir las fotos y actualizar professionals.photo_url.
//
// Uso:
//   node --env-file=.env.local scripts/compress-professional-photos.mjs
//   node --env-file=.env.local scripts/compress-professional-photos.mjs --apply

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "professional-photos";
const MAX_DIMENSION = 480;
const JPEG_QUALITY = 82;
// Si ya pesa menos que esto no vale la pena volver a comprimirla (reencodear no gana nada y
// solo pierde calidad).
const SKIP_IF_UNDER_BYTES = 150 * 1024;

const APPLY = process.argv.includes("--apply");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY -- correlo con --env-file=.env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(APPLY ? "Modo: APLICANDO cambios reales.\n" : "Modo: dry-run (no se escribe nada).\n");

  const { data: professionals, error } = await supabase
    .from("professionals")
    .select("id, full_name, photo_url")
    .not("photo_url", "is", null);
  if (error) throw error;

  let compressed = 0;
  let skipped = 0;
  let failed = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (const prof of professionals) {
    const label = `${prof.full_name} (${prof.id})`;
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(prof.id);
      if (listError) throw listError;

      const photoFile = files?.find((f) => f.name.startsWith("photo."));
      if (!photoFile) {
        console.log(`- (sin archivo en storage) ${label}`);
        continue;
      }

      const path = `${prof.id}/${photoFile.name}`;
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(path);
      if (downloadError) throw downloadError;

      const originalBuffer = Buffer.from(await blob.arrayBuffer());
      if (originalBuffer.length <= SKIP_IF_UNDER_BYTES) {
        console.log(`- (ya es chica, ${Math.round(originalBuffer.length / 1024)}KB) ${label}`);
        skipped++;
        continue;
      }

      const compressedBuffer = await sharp(originalBuffer)
        .rotate() // respeta la orientación EXIF antes de tirar los metadatos al reencodear
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();

      const beforeKB = Math.round(originalBuffer.length / 1024);
      const afterKB = Math.round(compressedBuffer.length / 1024);
      totalBefore += originalBuffer.length;
      totalAfter += compressedBuffer.length;

      if (!APPLY) {
        console.log(`- [dry-run] ${label}: ${beforeKB}KB -> ${afterKB}KB`);
        compressed++;
        continue;
      }

      const newPath = `${prof.id}/photo.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, compressedBuffer, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      // Si la foto original no era .jpg, el archivo viejo queda huérfano en el bucket.
      if (photoFile.name !== "photo.jpg") {
        await supabase.storage.from(BUCKET).remove([path]);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
      const newPhotoUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("professionals")
        .update({ photo_url: newPhotoUrl })
        .eq("id", prof.id);
      if (updateError) throw updateError;

      console.log(`- OK ${label}: ${beforeKB}KB -> ${afterKB}KB`);
      compressed++;
    } catch (err) {
      console.error(`- FALLÓ ${label}:`, err?.message ?? err);
      failed++;
    }
  }

  console.log(
    `\nListo. Comprimidas: ${compressed}, ya optimizadas: ${skipped}, fallidas: ${failed}.`,
  );
  if (totalBefore > 0) {
    console.log(
      `Peso total: ${Math.round(totalBefore / 1024)}KB -> ${Math.round(totalAfter / 1024)}KB.`,
    );
  }
  if (!APPLY && compressed > 0) {
    console.log("\nEsto fue un dry-run: no se escribió nada. Volvé a correr con --apply para aplicar los cambios.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
