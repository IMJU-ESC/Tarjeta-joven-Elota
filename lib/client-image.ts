export type ImagePurpose = "profile" | "document" | "businessLogo" | "facade";

type CompressionSpec = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  minQuality: number;
  targetBytes: number;
};

const specs: Record<ImagePurpose, CompressionSpec> = {
  profile: { maxWidth: 400, maxHeight: 400, quality: 0.72, minQuality: 0.5, targetBytes: 160_000 },
  document: { maxWidth: 1200, maxHeight: 1200, quality: 0.76, minQuality: 0.56, targetBytes: 500_000 },
  businessLogo: { maxWidth: 512, maxHeight: 512, quality: 0.76, minQuality: 0.52, targetBytes: 150_000 },
  facade: { maxWidth: 960, maxHeight: 960, quality: 0.7, minQuality: 0.5, targetBytes: 300_000 },
};

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No pudimos leer la imagen seleccionada."));
    image.src = source;
  });
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No pudimos leer el archivo seleccionado."));
    reader.readAsDataURL(file);
  });
}

export function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor(base64.length * 0.75) - padding);
}

export async function compressImageDataUrl(source: string, purpose: ImagePurpose) {
  const spec = specs[purpose];
  const image = await loadImage(source);
  const scale = Math.min(1, spec.maxWidth / image.naturalWidth, spec.maxHeight / image.naturalHeight);
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = spec.quality;
  let result = "";

  for (let attempt = 0; attempt < 9; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("El navegador no pudo optimizar la imagen.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    result = canvas.toDataURL("image/webp", quality);
    if (!result.startsWith("data:image/webp")) result = canvas.toDataURL("image/jpeg", quality);
    if (dataUrlBytes(result) <= spec.targetBytes) break;

    if (quality > spec.minQuality) quality = Math.max(spec.minQuality, quality - 0.06);
    else {
      width = Math.max(1, Math.round(width * 0.86));
      height = Math.max(1, Math.round(height * 0.86));
    }
  }

  return result;
}
