import "../styles/base.css";
import "../styles/layout.css";
import { setupFavoritesDropdown } from "../components/favorites-dropdown/favorites-dropdown.js";
import { formatMoney, getProducts } from "../services/products-service.js";
import { buildWhatsappUrl } from "../services/whatsapp-service.js";
import { getCart, getCartTotal, saveCart, updateQuantity } from "../services/cart-service.js";

let cart = getCart();

const itemsMount = document.getElementById("cartPageItems");
const totalMount = document.getElementById("cartPageTotal");
const subtotalMount = document.getElementById("cartPageSubtotal");
const countMount = document.getElementById("cartPageCount");
const whatsappButton = document.getElementById("cartWhatsappBtn");
const favoritesTrigger = document.querySelector(".favorites-trigger");

function renderCartPage() {
  itemsMount.innerHTML = cart.length ? "" : '<p class="empty-state">Tu carrito esta vacio.</p>';

  cart.forEach((item) => {
    const row = document.createElement("article");
    row.className = "cart-page-item";

    const image = document.createElement("img");
    image.src = item.imagen_url || "";
    image.alt = item.nombre || "Producto";

    const content = document.createElement("div");
    content.className = "cart-page-item-content";
    const name = document.createElement("strong");
    name.textContent = item.nombre || "Producto";
    const price = document.createElement("span");
    price.className = "cart-page-item-price";
    price.textContent = formatMoney(item.precio);

    const actions = document.createElement("div");
    actions.className = "cart-page-actions";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.setAttribute("aria-label", "Quitar una unidad");
    decrease.innerHTML = '<i class="fa-solid fa-minus"></i>';
    const quantity = document.createElement("strong");
    quantity.textContent = String(item.qty || 0);
    const increase = document.createElement("button");
    increase.type = "button";
    increase.setAttribute("aria-label", "Agregar una unidad");
    increase.innerHTML = '<i class="fa-solid fa-plus"></i>';
    const remove = document.createElement("button");
    remove.className = "cart-page-remove";
    remove.type = "button";
    remove.setAttribute("aria-label", "Eliminar producto");
    remove.innerHTML = '<i class="fa-regular fa-trash-can"></i>';

    decrease.addEventListener("click", () => changeQty(item.id, -1));
    increase.addEventListener("click", () => changeQty(item.id, 1));
    remove.addEventListener("click", () => changeQty(item.id, -Number(item.qty || 0)));

    actions.append(decrease, quantity, increase);
    content.append(name, price, actions);
    row.append(image, content, remove);
    itemsMount.appendChild(row);
  });

  const total = getCartTotal(cart);
  const itemCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  totalMount.textContent = formatMoney(total);
  if (subtotalMount) subtotalMount.textContent = formatMoney(total);
  if (countMount) countMount.textContent = String(itemCount);
  whatsappButton.href = buildWhatsappUrl(cart);
}

function changeQty(id, amount) {
  cart = updateQuantity(cart, id, amount);
  saveCart(cart);
  renderCartPage();
}

async function setupHeaderFavorites() {
  const products = await getProducts();
  setupFavoritesDropdown({
    trigger: favoritesTrigger,
    products,
  });
}

renderCartPage();
setupHeaderFavorites();
