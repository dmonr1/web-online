import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        product: resolve(__dirname, "producto/index.html"),
        search: resolve(__dirname, "busqueda/index.html"),
        cart: resolve(__dirname, "carrito/index.html"),
      },
    },
  },
});
