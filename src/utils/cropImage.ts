export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CROP_PRESETS = {
  /** Foto de perfil: quadrada, exibida em círculo. */
  avatar: { aspect: 1, width: 512, height: 512 },
  /** Capa do perfil: faixa larga, 3:1. */
  cover: { aspect: 3, width: 1500, height: 500 },
} as const;

export type CropKind = keyof typeof CROP_PRESETS;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    image.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Recorta a área escolhida e redimensiona para o tamanho final do preset.
 * Gera WebP (ou JPEG, se o navegador não suportar WebP no canvas).
 */
export async function cropImage(src: string, area: PixelArea, kind: CropKind): Promise<File> {
  const { width, height } = CROP_PRESETS[kind];
  const image = await loadImage(src);

  // Não aumenta imagens pequenas além do tamanho do recorte
  const scale = Math.min(1, area.width / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * (scale < 1 ? scale : 1));
  canvas.height = Math.round(height * (scale < 1 ? scale : 1));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não permite editar imagens");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

  let blob = await toBlob(canvas, "image/webp", 0.88);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.9);
  if (!blob) throw new Error("Não foi possível gerar a imagem");

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${kind}.${extension}`, { type: blob.type });
}
