import { supabase } from "../config/supabase";

const BUCKET = "profile-images";

/**
 * Envia uma imagem para a pasta do usuário no Storage e devolve a URL pública.
 * O nome é fixo por tipo (substitui a anterior); o parâmetro "v" evita cache antigo.
 */
async function uploadUserImage(file: File, userId: string, kind: "profile" | "cover") {
  const path = `${userId}/${kind}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw new Error("Erro ao fazer upload da imagem", { cause: error });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  return uploadUserImage(file, userId, "profile");
}

export function uploadCoverPhoto(file: File, userId: string): Promise<string> {
  return uploadUserImage(file, userId, "cover");
}
