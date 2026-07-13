import { storeConfig } from "../config.js";

export function hasCloudinaryUploadConfig() {
  return Boolean(storeConfig.cloudinary?.cloudName && storeConfig.cloudinary?.uploadPreset);
}

export function getOptimizedCloudinaryUrl(url, width = 900) {
  if (!url || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}

export async function uploadProductImage(file) {
  if (!hasCloudinaryUploadConfig()) {
    throw new Error("Falta configurar Cloudinary.");
  }

  if (!file?.type?.startsWith("image/")) {
    throw new Error("Selecciona una imagen valida.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", storeConfig.cloudinary.uploadPreset);
  formData.append("folder", "productos");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${storeConfig.cloudinary.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "No se pudo subir la imagen.");
  }

  return getOptimizedCloudinaryUrl(data.secure_url);
}
