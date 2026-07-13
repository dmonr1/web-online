import template from "./cart-panel.html?raw";
import "./cart-panel.css";
import { formatMoney } from "../../services/products-service.js";
import { getCartTotal, updateQuantity } from "../../services/cart-service.js";

export function createCartPanel({ cart, onChange, onClose, onClear }) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const element = wrapper.firstElementChild;
  let currentCart = cart;

  element.addEventListener("click", (event) => event.stopPropagation());
  element.querySelector("[data-close]")?.addEventListener("click", onClose);
  element.querySelector("[data-clear]").addEventListener("click", () => {
    if (onClear) {
      onClear();
      return;
    }
    onChange([]);
  });
  element.querySelector("[data-items]").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "increase") onChange(updateQuantity(currentCart, button.dataset.id, 1));
    if (button.dataset.action === "decrease") onChange(updateQuantity(currentCart, button.dataset.id, -1));
    if (button.dataset.action === "remove") {
      const item = currentCart.find((cartItem) => cartItem.id === button.dataset.id);
      onChange(updateQuantity(currentCart, button.dataset.id, item ? -item.qty : 0));
    }
  });

  element.setCart = (nextCart) => {
    currentCart = nextCart;
  };

  renderCart(element, cart);
  return element;
}

export function renderCart(element, cart) {
  if (!element) return;
  element.setCart?.(cart);
  const items = element.querySelector("[data-items]");
  const total = element.querySelector("[data-total]");
  const checkout = element.querySelector("[data-checkout]");
  items.innerHTML = cart.length
    ? ""
    : `
      <div class="cart-empty-state">
        <i class="fa-solid fa-cart-shopping"></i>
        <strong>Tu carrito esta vacio</strong>
        <span>Agrega productos para verlos aqui.</span>
      </div>
    `;

  cart.forEach((item) => {
    const imageUrl = item.imagen_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80";
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-item-image" src="${imageUrl}" alt="${item.nombre}" loading="lazy">
      <div class="cart-item-content">
        <strong>${item.nombre}</strong>
        <span class="cart-item-line">${item.qty} x ${formatMoney(item.precio)}</span>
        <div class="cart-item-actions">
          <div class="qty-controls">
            <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Quitar una unidad">
              <i class="fa-solid fa-minus" aria-hidden="true"></i>
            </button>
            <span>Agregar</span>
            <button type="button" data-action="increase" data-id="${item.id}" aria-label="Agregar una unidad">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
          </div>
          <button class="remove-button" type="button" data-action="remove" data-id="${item.id}" aria-label="Quitar ${item.nombre}">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
    items.appendChild(row);
  });

  total.textContent = formatMoney(getCartTotal(cart));
  checkout.href = "/carrito/";
}
