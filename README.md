# Web Ventas - Vite + Componentes HTML/CSS/JS

Estructura sin Vue ni React. Cada componente tiene su propio HTML, JS y CSS.

## Rutas

```text
/
/admin/
/producto/?id=1
```

## Configuracion

Configura variables de entorno. Copia `.env.example` a `.env` y completa tus valores:

```env
VITE_STORE_NAME=Tienda
VITE_ADMIN_TOKEN=tu-clave-secreta
VITE_WHATSAPP_NUMBER=51999999999
VITE_SHEET_CSV_URL=URL_CSV_DE_GOOGLE_SHEETS
VITE_APPS_SCRIPT_URL=URL_DE_APPS_SCRIPT
VITE_CLOUDINARY_CLOUD_NAME=tu-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset
```

## Levantar

```powershell
cd D:\web-ventas
npm install
npm run dev
```

## Google Sheets

La hoja debe llamarse `productos` y tener:

```text
id,nombre,categoria,precio,stock,descripcion,imagen_url,activo,creado_en
```

## Apps Script

Pega el contenido de:

```text
scripts/google-apps-script.gs
```

Configura:

```text
ADMIN_TOKEN = tu-clave-secreta
```

Despliega como aplicacion web y pega la URL `/exec` en `appsScriptUrl`.

## Netlify

```text
Build command: npm run build
Publish directory: dist
```
