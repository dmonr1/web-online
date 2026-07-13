import template from "./product-card.html?raw";
import "./product-card.css";
import { formatMoney } from "../../services/products-service.js";

const lazyImageObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const image = entry.target;
            image.src = image.dataset.src;
            lazyImageObserver.unobserve(image);
          });
        },
        {
          rootMargin: "1200px 0px",
          threshold: 0.01,
        },
      )
    : null;

function queueImageLoad(image) {
  if (!image.dataset.src) return;

  if (lazyImageObserver) {
    lazyImageObserver.observe(image);
    return;
  }

  image.src = image.dataset.src;
}

export function createProductCard(product, onAdd, { isFavorite = false, onFavoriteToggle, searchMatch = false, animationDelay = 0 } = {}) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const element = wrapper.firstElementChild;
  element.classList.toggle("is-search-match", Boolean(searchMatch));
  if (searchMatch) element.style.animationDelay = `${animationDelay}ms`;

  const detailUrl = `/producto/?id=${encodeURIComponent(product.id)}`;
  const imageUrl = product.imagen_url || "";
  const media = element.querySelector("[data-detail-link]");
  const image = element.querySelector("[data-image]");
  const favoriteButton = element.querySelector("[data-favorite]");
  media.href = detailUrl;
  media.classList.add("is-loading");
  image.addEventListener("load", () => media.classList.remove("is-loading"));
  image.alt = product.nombre || "Producto";
  image.dataset.src = imageUrl;
  element.querySelector("[data-brand]").textContent = product.marca || product.categoria || "Producto";
  element.querySelector("[data-name]").textContent = product.nombre || "Producto";
  element.querySelector("[data-price]").textContent = formatMoney(product.precio);
  element.querySelector("[data-add]").addEventListener("click", (event) => {
    event.currentTarget.classList.remove("is-popping");
    void event.currentTarget.offsetWidth;
    event.currentTarget.classList.add("is-popping");
    onAdd(product);
  });
  favoriteButton.classList.toggle("is-active", isFavorite);
  favoriteButton.querySelector("i").className = isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart";
  favoriteButton.addEventListener("click", (event) => {
    event.preventDefault();
    favoriteButton.classList.remove("is-clicking");
    void favoriteButton.offsetWidth;
    favoriteButton.classList.add("is-clicking");
    const nextState = onFavoriteToggle?.(product);
    favoriteButton.classList.toggle("is-active", nextState);
    favoriteButton.querySelector("i").className = nextState ? "fa-solid fa-heart" : "fa-regular fa-heart";
  });

  queueImageLoad(image);

  return element;
}
