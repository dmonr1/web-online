import template from "./brand-form.html?raw";
import "./brand-form.css";
import { sendAdminAction } from "../../services/products-service.js";

export function createBrandForm({ getToken, onSaved }) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const form = wrapper.firstElementChild;
  const status = form.querySelector("[data-status]");
  let mode = "create";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    status.textContent = "Guardando marca...";

    try {
      await sendAdminAction({
        action: mode === "edit" ? "update_brand" : "create_brand",
        token: getToken(),
        id: data.get("id"),
        nombre: data.get("nombre"),
        activo: form.activo.checked ? "SI" : "NO",
      });

      form.reset();
      form.activo.checked = true;
      status.textContent = mode === "edit" ? "Marca actualizada." : "Marca creada.";
      onSaved();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  return {
    element: form,
    setBrand(brand) {
      mode = brand ? "edit" : "create";
      form.reset();
      form.id.value = brand?.id || "";
      form.nombre.value = brand?.nombre || "";
      form.activo.checked = brand ? brand.activo !== "NO" : true;
      status.textContent = "";
    },
  };
}
