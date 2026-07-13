import { formatMoney } from "../../services/products-service.js";

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem("storeFavorites") || "[]").map(String);
  } catch {
    return [];
  }
}

function createEmptyState() {
  const empty = document.createElement("div");
  empty.className = "favorites-dropdown-empty";

  const icon = document.createElement("i");
  icon.className = "fa-regular fa-heart";
  icon.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.textContent = "Todavia no tienes favoritos.";

  empty.append(icon, text);
  return empty;
}

function createFavoriteItem(product) {
  const link = document.createElement("a");
  link.className = "favorites-dropdown-item";
  link.href = `/producto/?id=${encodeURIComponent(product.id)}`;

  const imageBox = document.createElement("span");
  imageBox.className = "favorites-dropdown-image";

  if (product.imagen_url) {
    const image = document.createElement("img");
    image.src = product.imagen_url;
    image.alt = "";
    imageBox.appendChild(image);
  }

  const info = document.createElement("span");
  info.className = "favorites-dropdown-info";

  const name = document.createElement("strong");
  name.textContent = product.nombre || "Producto";

  const meta = document.createElement("small");
  meta.textContent = product.marca || product.categoria || "Favorito";

  info.append(name, meta);

  const price = document.createElement("span");
  price.className = "favorites-dropdown-price";
  price.textContent = formatMoney(product.precio);

  link.append(imageBox, info, price);
  return link;
}

export function setupFavoritesDropdown({ trigger, products, getFavorites = readFavorites } = {}) {
  if (!trigger) return null;

  const wrapper = trigger.closest(".header-actions") || trigger.parentElement;
  if (!wrapper) return null;

  wrapper.classList.add("has-favorites-dropdown");
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");

  const dropdown = document.createElement("div");
  dropdown.className = "favorites-dropdown";
  dropdown.hidden = true;
  wrapper.appendChild(dropdown);

  function getFavoriteProducts() {
    const favoriteIds = getFavorites().map(String);
    return products.filter((product) => favoriteIds.includes(String(product.id)));
  }

  function render() {
    dropdown.innerHTML = "";

    const header = document.createElement("div");
    header.className = "favorites-dropdown-head";

    const title = document.createElement("strong");
    title.textContent = "Mis favoritos";

    const count = document.createElement("span");
    const favoritesProducts = getFavoriteProducts();
    count.textContent = String(favoritesProducts.length);

    header.append(title, count);
    dropdown.appendChild(header);

    if (!favoritesProducts.length) {
      dropdown.appendChild(createEmptyState());
      return;
    }

    const list = document.createElement("div");
    list.className = "favorites-dropdown-list";
    favoritesProducts.forEach((product) => list.appendChild(createFavoriteItem(product)));
    dropdown.appendChild(list);
  }

  function close() {
    dropdown.hidden = true;
    trigger.classList.remove("is-active");
    trigger.setAttribute("aria-expanded", "false");
  }

  function open() {
    render();
    dropdown.hidden = false;
    trigger.classList.add("is-active");
    trigger.setAttribute("aria-expanded", "true");
  }

  function toggle() {
    if (dropdown.hidden) {
      open();
    } else {
      close();
    }
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    trigger.classList.remove("is-clicking");
    void trigger.offsetWidth;
    trigger.classList.add("is-clicking");
    toggle();
  });

  document.addEventListener("click", (event) => {
    if (wrapper.contains(event.target)) return;
    close();
  });

  window.addEventListener("storage", render);

  return { close, open, render, toggle };
}
