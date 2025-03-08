export async function uploadImage(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'seasonscore_unsigned');
  formData.append('folder', `seasonscore/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao fazer upload da imagem');
  }

  const data = await response.json();
  return data.secure_url;
}

export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  return uploadImage(file, `users/${userId}/profile`);
}

export async function uploadCoverPhoto(file: File, userId: string): Promise<string> {
  return uploadImage(file, `users/${userId}/cover`);
} 