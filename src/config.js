export const storeConfig = {
  storeName: import.meta.env.VITE_STORE_NAME || "Tienda",
  adminToken: import.meta.env.VITE_ADMIN_TOKEN || "",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || "",
  sheetCsvUrl: import.meta.env.VITE_SHEET_CSV_URL || "",
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL || "",
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
  },
  currency: "S/",
};
