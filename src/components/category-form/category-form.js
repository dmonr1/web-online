import template from "./category-form.html?raw";
import "./category-form.css";
import { sendAdminAction } from "../../services/products-service.js";

export function createCategoryForm({ getToken, onSaved }) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const form = wrapper.firstElementChild;
  const status = form.querySelector("[data-status]");
  let mode = "create";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    status.textContent = "Guardando categoria...";

    try {
      await sendAdminAction({
        action: mode === "edit" ? "update_category" : "create_category",
        token: getToken(),
        id: data.get("id"),
        nombre: data.get("nombre"),
        activo: form.activo.checked ? "SI" : "NO",
      });

      form.reset();
      form.activo.checked = true;
      status.textContent = mode === "edit" ? "Categoria actualizada." : "Categoria creada.";
      onSaved();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  return {
    element: form,
    setCategory(category) {
      mode = category ? "edit" : "create";
      form.reset();
      form.id.value = category?.id || "";
      form.nombre.value = category?.nombre || "";
      form.activo.checked = category ? category.activo !== "NO" : true;
      status.textContent = "";
    },
  };
}
