const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.82;

// Las fotos de perfil se suben tal cual las saca el celular (hasta 5MB, sin resize) y se
// sirven con <img> plano, sin optimización de Next.js (no hay images.remotePatterns
// configurado) -- eso es lo que disparó el excedente de "Cached Egress" en Supabase. Se
// redimensionan/comprimen acá, en el navegador, antes de subirlas: un avatar de 480px en JPEG
// calidad 82% pesa decenas de KB en vez de varios MB, sin depender de ninguna transformación
// server-side (no disponible en el plan actual de Supabase).
export async function compressPhoto(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  const fileName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], fileName, { type: "image/jpeg" });
}
