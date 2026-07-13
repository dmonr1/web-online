import template from "./product-list.html?raw";
import "./product-list.css";
import { formatMoney } from "../../services/products-service.js";

export function createProductList(products, onAction) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const element = wrapper.firstElementChild;
  const list = element.matches("[data-list]") ? element : element.querySelector("[data-list]");

  if (!products.length) {
    list.innerHTML = '<p class="empty-state">No hay productos activos.</p>';
    return element;
  }

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "manage-card";
    card.innerHTML = `
      <img src="${product.imagen_url || ""}" alt="${product.nombre || "Producto"}" loading="lazy">
      <div class="manage-info">
        <strong>${product.nombre || "Producto sin nombre"}</strong>
        <span>ID: <b>${product.id}</b></span>
        <span>${product.categoria || "Sin categoria"} / ${product.marca || "Sin marca"} - ${formatMoney(product.precio)}</span>
        <span>Stock: <b>${product.stock || 0}</b> - Estado: <b>${product.activo || "SI"}</b></span>
      </div>
      <div class="manage-actions">
        <button type="button" data-action="adjust_stock" data-delta="1" data-id="${product.id}">+1</button>
        <button type="button" data-action="adjust_stock" data-delta="-1" data-id="${product.id}">-1</button>
        <button type="button" data-action="edit" data-id="${product.id}" title="Modificar">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" data-action="set_active" data-active="${product.activo === "NO" ? "SI" : "NO"}" data-id="${product.id}" title="${product.activo === "NO" ? "Mostrar" : "Ocultar"}">
          <i class="fa-solid ${product.activo === "NO" ? "fa-eye" : "fa-eye-slash"}"></i>
        </button>
      </div>
    `;
    list.appendChild(card);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "adjust_stock") {
      onAction({ action: "adjust_stock", id: button.dataset.id, delta: button.dataset.delta });
    }

    if (button.dataset.action === "set_active") {
      onAction({ action: "set_active", id: button.dataset.id, activo: button.dataset.active });
    }

    if (button.dataset.action === "edit") {
      const product = products.find((item) => String(item.id) === String(button.dataset.id));
      onAction({ action: "edit", product });
    }
  });

  return element;
}
