import "../styles/base.css";
import "../styles/layout.css";
import { setupFavoritesDropdown } from "../components/favorites-dropdown/favorites-dropdown.js";
import { createProductCard } from "../components/product-card/product-card.js";
import { createCartPanel, renderCart } from "../components/cart-panel/cart-panel.js";
import { addToCart, getCart, saveCart } from "../services/cart-service.js";
import { getProductStock, getProducts, formatMoney, isProductOutOfStock } from "../services/products-service.js";
import { buildWhatsappUrl } from "../services/whatsapp-service.js";

const mount = document.getElementById("productDetailMount");
const storeHeader = document.querySelector(".store-header");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const favoritesTrigger = document.querySelector(".favorites-trigger");
const openCartBtn = document.getElementById("openCartBtn");
const floatingCartBtn = document.getElementById("floatingCartBtn");
const cartBadge = document.getElementById("cartBadge");
const floatingCartBadge = document.getElementById("floatingCartBadge");
const cartMount = document.getElementById("cartMount");
const cartBackdrop = document.getElementById("cartBackdrop");

let products = [];
let product = null;
let cart = getCart();
let cartPanel = null;
let favorites = getFavorites();
let favoritesDropdown = null;
const RECENTLY_VIEWED_KEY = "recentlyViewedProducts";

function getProductId() {
  return new URLSearchParams(window.location.search).get("id");
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("storeFavorites") || "[]");
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem("storeFavorites", JSON.stringify(favorites));
}

function updateHeaderState() {
  const currentScrollY = window.scrollY;
  const isAwayFromTop = currentScrollY > 90;
  storeHeader?.classList.toggle("is-scrolled", currentScrollY > 12);
  storeHeader?.classList.toggle("is-hidden", isAwayFromTop);
  floatingCartBtn?.classList.toggle("is-visible", isAwayFromTop);
}

function getRecentlyViewedIds() {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentlyViewed(targetProduct) {
  const productId = String(targetProduct.id);
  const nextIds = [productId, ...getRecentlyViewedIds().filter((id) => String(id) !== productId)].slice(0, 7);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextIds));
}

function toggleFavorite(targetProduct) {
  const productId = String(targetProduct.id);
  const exists = favorites.includes(productId);
  favorites = exists ? favorites.filter((id) => id !== productId) : [...favorites, productId];
  saveFavorites();
  favoritesDropdown?.render();
  return !exists;
}

function matchesSearchText(targetProduct, query) {
  if (!query) return true;
  const text = [targetProduct.nombre, targetProduct.descripcion, targetProduct.categoria, targetProduct.marca].join(" ").toLowerCase();
  return text.includes(query.toLowerCase());
}

function getProductImages(targetProduct) {
  return [
    targetProduct.imagen_url,
    targetProduct.imagen_2_url,
    targetProduct.imagen_3_url,
    targetProduct.imagen_4_url,
    targetProduct.imagen_5_url,
  ].filter(Boolean);
}

function createGallery(targetProduct) {
  const images = getProductImages(targetProduct);
  const gallery = document.createElement("div");
  gallery.className = "product-gallery";

  const mainImageWrap = document.createElement("div");
  mainImageWrap.className = "product-gallery-frame";

  const mainImage = document.createElement("img");
  mainImage.className = "product-gallery-main";
  mainImage.src = images[0] || "";
  mainImage.alt = targetProduct.nombre || "Producto";
  mainImageWrap.appendChild(mainImage);
  gallery.appendChild(mainImageWrap);

  if (images.length <= 1) return gallery;

  const thumbnails = document.createElement("div");
  thumbnails.className = "product-thumbnails";

  images.forEach((imageUrl, index) => {
    const button = document.createElement("button");
    button.className = `product-thumbnail ${index === 0 ? "is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `Ver imagen ${index + 1}`);

    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    button.appendChild(image);

    button.addEventListener("click", () => {
      mainImage.classList.remove("is-switching");
      void mainImage.offsetWidth;
      mainImage.src = imageUrl;
      mainImage.classList.add("is-switching");
      thumbnails.querySelectorAll(".product-thumbnail").forEach((thumbnail) => {
        thumbnail.classList.toggle("is-active", thumbnail === button);
      });
    });

    thumbnails.appendChild(button);
  });

  gallery.appendChild(thumbnails);
  return gallery;
}

function createSpecTable(targetProduct) {
  const stockValue = getProductStock(targetProduct);
  const specs = [
    ["Marca", targetProduct.marca],
    ["Categoria", targetProduct.categoria],
    ["Precio", formatMoney(targetProduct.precio)],
    ["Stock", stockValue === null ? "No informado" : stockValue],
  ];

  const table = document.createElement("table");
  table.className = "spec-table";
  specs.forEach(([label, value]) => {
    const row = document.createElement("tr");
    const labelCell = document.createElement("th");
    const valueCell = document.createElement("td");
    labelCell.textContent = label;
    valueCell.textContent = value || "-";
    row.append(labelCell, valueCell);
    table.appendChild(row);
  });

  return table;
}

function createAccordion(titleText, contentNode) {
  const details = document.createElement("details");
  details.className = "product-accordion";

  const summary = document.createElement("summary");
  summary.innerHTML = `<span>${titleText}</span><i class="fa-solid fa-chevron-down"></i>`;

  const content = document.createElement("div");
  content.className = "product-accordion-content";
  content.appendChild(contentNode);

  details.append(summary, content);
  return details;
}

function createBreadcrumbs(targetProduct) {
  const nav = document.createElement("nav");
  nav.className = "breadcrumbs";
  nav.setAttribute("aria-label", "Ruta del producto");

  const home = document.createElement("a");
  home.href = "/";
  home.innerHTML = '<i class="fa-solid fa-house"></i><span>Inicio</span>';

  const category = document.createElement("a");
  category.href = `/busqueda/?categoria=${encodeURIComponent(targetProduct.categoria || "")}`;
  category.textContent = targetProduct.categoria || "Categoria";

  const current = document.createElement("span");
  current.textContent = targetProduct.nombre || "Producto";

  nav.append(home, category, current);
  return nav;
}

function addQuantityToCart(targetProduct, qty) {
  if (isProductOutOfStock(targetProduct)) return;
  for (let count = 0; count < qty; count += 1) {
    cart = addToCart(cart, targetProduct);
  }
  saveCart(cart);
  refreshCart();
  openCartBtn?.classList.remove("is-bumping");
  floatingCartBtn?.classList.remove("is-bumping");
  void openCartBtn?.offsetWidth;
  void floatingCartBtn?.offsetWidth;
  openCartBtn?.classList.add("is-bumping");
  floatingCartBtn?.classList.add("is-bumping");
}

function createPurchasePanel(targetProduct) {
  let qty = 1;
  const stockValue = getProductStock(targetProduct);
  const productIsOutOfStock = isProductOutOfStock(targetProduct);
  const panel = document.createElement("aside");
  panel.className = `product-buy-panel ${productIsOutOfStock ? "is-out-of-stock" : ""}`;

  const brand = document.createElement("p");
  brand.className = "product-detail-brand";
  brand.textContent = targetProduct.marca || targetProduct.categoria || "Producto";

  const title = document.createElement("h1");
  title.textContent = targetProduct.nombre || "Producto";

  const price = document.createElement("strong");
  price.className = "product-detail-price";
  price.textContent = formatMoney(targetProduct.precio);

  const stock = document.createElement("span");
  stock.className = `product-stock-pill ${productIsOutOfStock ? "is-out-of-stock" : ""}`;
  stock.innerHTML = productIsOutOfStock
    ? '<i class="fa-solid fa-circle-exclamation"></i> Producto agotado'
    : `<i class="fa-solid fa-box"></i> ${stockValue === null ? "Stock disponible" : `Stock disponible: ${stockValue}`}`;

  const qtyRow = document.createElement("div");
  qtyRow.className = "detail-qty-row";
  const qtyLabel = document.createElement("span");
  qtyLabel.textContent = "Cantidad";
  const qtyControls = document.createElement("div");
  qtyControls.className = "detail-qty-controls";
  const decreaseBtn = document.createElement("button");
  decreaseBtn.type = "button";
  decreaseBtn.innerHTML = '<i class="fa-solid fa-minus"></i>';
  const qtyValue = document.createElement("strong");
  qtyValue.textContent = productIsOutOfStock ? "Sin stock" : "Agregar";
  const addQtyValue = document.createElement("span");
  addQtyValue.className = "add-button-qty";
  addQtyValue.textContent = String(qty);
  const increaseBtn = document.createElement("button");
  increaseBtn.type = "button";
  increaseBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  qtyControls.append(decreaseBtn, qtyValue, increaseBtn);
  qtyRow.append(qtyLabel, qtyControls);

  decreaseBtn.addEventListener("click", () => {
    if (productIsOutOfStock) return;
    qty = Math.max(1, qty - 1);
    addQtyValue.textContent = String(qty);
  });
  increaseBtn.addEventListener("click", () => {
    if (productIsOutOfStock) return;
    qty += 1;
    addQtyValue.textContent = String(qty);
  });

  const actions = document.createElement("div");
  actions.className = "product-detail-actions";

  const addButton = document.createElement("button");
  addButton.className = "primary-button";
  addButton.type = "button";
  addButton.disabled = productIsOutOfStock;
  addButton.innerHTML = productIsOutOfStock
    ? '<i class="fa-solid fa-ban"></i><span>Producto agotado</span>'
    : '<i class="fa-solid fa-cart-plus"></i><span>Agregar al carrito</span>';
  if (!productIsOutOfStock) addButton.appendChild(addQtyValue);
  addButton.addEventListener("click", () => {
    if (productIsOutOfStock) return;
    addButton.classList.remove("is-popping");
    void addButton.offsetWidth;
    addButton.classList.add("is-popping");
    addQuantityToCart(targetProduct, qty);
  });

  const favoriteButton = document.createElement("button");
  favoriteButton.className = `favorite-detail-button ${favorites.includes(String(targetProduct.id)) ? "is-active" : ""}`;
  favoriteButton.type = "button";
  favoriteButton.innerHTML = `<i class="${favorites.includes(String(targetProduct.id)) ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
  favoriteButton.addEventListener("click", () => {
    favoriteButton.classList.remove("is-clicking");
    void favoriteButton.offsetWidth;
    favoriteButton.classList.add("is-clicking");
    const nextState = toggleFavorite(targetProduct);
    favoriteButton.classList.toggle("is-active", nextState);
    favoriteButton.querySelector("i").className = nextState ? "fa-solid fa-heart" : "fa-regular fa-heart";
  });

  const whatsappLink = document.createElement("a");
  whatsappLink.className = "whatsapp-button detail-whatsapp";
  whatsappLink.href = buildWhatsappUrl([{ ...targetProduct, qty }]);
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener";
  whatsappLink.innerHTML = productIsOutOfStock
    ? '<i class="fa-solid fa-ban"></i> Sin stock disponible'
    : '<i class="fa-brands fa-whatsapp"></i> Continuar en WhatsApp';
  if (productIsOutOfStock) {
    whatsappLink.removeAttribute("href");
    whatsappLink.removeAttribute("target");
    whatsappLink.setAttribute("aria-disabled", "true");
  }
  whatsappLink.addEventListener("click", () => {
    if (productIsOutOfStock) return;
    whatsappLink.href = buildWhatsappUrl([{ ...targetProduct, qty }]);
  });

  decreaseBtn.disabled = productIsOutOfStock;
  increaseBtn.disabled = productIsOutOfStock;

  actions.append(addButton, whatsappLink);

  panel.append(favoriteButton, brand, title, price, stock, qtyRow, actions);
  return panel;
}

function renderSimilarProducts(targetProduct) {
  const similar = products
    .filter((item) => String(item.id) !== String(targetProduct.id))
    .filter((item) => item.categoria === targetProduct.categoria || item.marca === targetProduct.marca)
    .slice(0, 10);

  if (!similar.length) return null;

  const section = document.createElement("section");
  section.className = "similar-products-section";
  const head = document.createElement("div");
  head.className = "section-head";
  const titleBox = document.createElement("div");
  titleBox.innerHTML = "<h2>Tambien podria interesarte</h2>";

  const rail = document.createElement("div");
  rail.className = "similar-products-rail";
  similar.forEach((item) => {
    rail.appendChild(
      createProductCard(item, (selectedProduct) => addQuantityToCart(selectedProduct, 1), {
        isFavorite: favorites.includes(String(item.id)),
        onFavoriteToggle: toggleFavorite,
      }),
    );
  });

  head.appendChild(titleBox);
  section.append(head, createCarouselShell(rail));
  return section;
}

function createCarouselShell(rail) {
  const shell = document.createElement("div");
  shell.className = "carousel-shell";
  const controls = createCarouselControls(rail);
  shell.append(controls.previous, rail, controls.next);
  return shell;
}

function createCarouselControls(rail) {
  const controls = document.createElement("div");
  controls.className = "carousel-controls";

  const previous = document.createElement("button");
  previous.type = "button";
  previous.setAttribute("aria-label", "Ver productos anteriores");
  previous.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

  const next = document.createElement("button");
  next.type = "button";
  next.setAttribute("aria-label", "Ver mas productos");
  next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

  previous.addEventListener("click", () => {
    rail.scrollBy({ left: -Math.max(260, rail.clientWidth * 0.75), behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    rail.scrollBy({ left: Math.max(260, rail.clientWidth * 0.75), behavior: "smooth" });
  });

  controls.append(previous, next);
  return { previous, next };
}

function renderRecentlyViewed(targetProduct) {
  const recentProducts = getRecentlyViewedIds()
    .filter((id) => String(id) !== String(targetProduct.id))
    .map((id) => products.find((item) => String(item.id) === String(id)))
    .filter(Boolean)
    .slice(0, 7);

  if (!recentProducts.length) return null;

  const section = document.createElement("section");
  section.className = "similar-products-section";
  const head = document.createElement("div");
  head.className = "section-head";
  const titleBox = document.createElement("div");
  titleBox.innerHTML = "<h2>Vistos recientemente</h2>";

  const rail = document.createElement("div");
  rail.className = "similar-products-rail";
  recentProducts.forEach((item) => {
    rail.appendChild(
      createProductCard(item, (selectedProduct) => addQuantityToCart(selectedProduct, 1), {
        isFavorite: favorites.includes(String(item.id)),
        onFavoriteToggle: toggleFavorite,
      }),
    );
  });

  head.appendChild(titleBox);
  section.append(head, createCarouselShell(rail));
  return section;
}

function renderProductDetailSkeleton() {
  const productCardSkeleton = `
    <article class="product-card product-card-skeleton">
      <div class="skeleton-media"></div>
      <div class="skeleton-info">
        <span></span>
        <strong></strong>
        <div><b></b><em></em></div>
      </div>
    </article>
  `;
  const productRailSkeleton = `
    <section class="similar-products-section product-rail-skeleton">
      <div class="section-head">
        <div><h2></h2></div>
      </div>
      <div class="similar-products-rail">
        ${productCardSkeleton.repeat(5)}
      </div>
    </section>
  `;

  mount.innerHTML = `
    <nav class="breadcrumbs product-skeleton-breadcrumbs" aria-label="Cargando ruta del producto">
      <span></span>
      <span></span>
      <span></span>
    </nav>

    <section class="product-detail-shell product-detail-skeleton" aria-label="Cargando detalle del producto">
      <div class="product-gallery product-gallery-skeleton">
        <div class="product-gallery-frame skeleton-block"></div>
        <div class="product-thumbnails product-thumbnails-skeleton">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <aside class="product-buy-panel product-buy-panel-skeleton">
        <span class="skeleton-pill"></span>
        <strong class="skeleton-title"></strong>
        <strong class="skeleton-title is-short"></strong>
        <span class="skeleton-price"></span>
        <span class="skeleton-pill is-stock"></span>
        <div class="skeleton-row">
          <span></span>
          <strong></strong>
        </div>
        <div class="skeleton-actions">
          <span></span>
          <span></span>
        </div>
      </aside>
    </section>

    <section class="product-info-section product-info-skeleton">
      <div class="product-accordion">
        <span></span>
        <strong></strong>
      </div>
      <div class="product-accordion">
        <span></span>
        <strong></strong>
      </div>
    </section>

    ${productRailSkeleton}
    ${productRailSkeleton}
  `;
}

function renderProductDetail(targetProduct) {
  mount.innerHTML = "";

  mount.appendChild(createBreadcrumbs(targetProduct));

  const shell = document.createElement("section");
  shell.className = "product-detail-shell";
  shell.append(createGallery(targetProduct), createPurchasePanel(targetProduct));

  const info = document.createElement("section");
  info.className = "product-info-section";

  const description = document.createElement("p");
  description.textContent = targetProduct.descripcion || "Sin descripcion disponible.";

  info.append(createAccordion("Descripcion", description), createAccordion("Especificaciones", createSpecTable(targetProduct)));
  mount.append(shell, info);

  const similar = renderSimilarProducts(targetProduct);
  if (similar) mount.appendChild(similar);

  const recentlyViewed = renderRecentlyViewed(targetProduct);
  if (recentlyViewed) mount.appendChild(recentlyViewed);
}

function refreshCart() {
  cart = cart.map((item) => {
    const currentProduct = products.find((candidate) => String(candidate.id) === String(item.id));
    return {
      ...item,
      imagen_url: currentProduct?.imagen_url || item.imagen_url || "",
    };
  });
  saveCart(cart);
  renderCart(cartPanel, cart);
  const itemCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  if (cartBadge) cartBadge.textContent = itemCount;
  if (floatingCartBadge) floatingCartBadge.textContent = itemCount;
}

function openCartPanel(mode = "header") {
  if (!cartPanel) return;
  cartPanel.classList.toggle("is-flyout", mode === "floating");
  cartPanel.classList.add("is-open");
}

function closeCartPanel() {
  if (!cartPanel) return;
  cartPanel.classList.remove("is-open");
}

function getSearchMatches(query) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];
  return products.filter((item) => matchesSearchText(item, normalizedQuery)).slice(0, 6);
}

function hideSearchSuggestions() {
  if (!searchSuggestions) return;
  searchSuggestions.hidden = true;
  searchSuggestions.innerHTML = "";
}

function renderSearchSuggestions() {
  if (!searchSuggestions || !searchInput) return;
  const matches = getSearchMatches(searchInput.value);
  if (!matches.length) {
    hideSearchSuggestions();
    return;
  }

  searchSuggestions.innerHTML = "";
  const fragment = document.createDocumentFragment();
  matches.forEach((item) => {
    const link = document.createElement("a");
    link.className = "search-suggestion";
    link.href = `/producto/?id=${encodeURIComponent(item.id)}`;

    const imageBox = document.createElement("span");
    imageBox.className = "search-suggestion-image";
    if (item.imagen_url) {
      const image = document.createElement("img");
      image.src = item.imagen_url;
      image.alt = "";
      imageBox.appendChild(image);
    }

    const info = document.createElement("span");
    info.className = "search-suggestion-info";
    const name = document.createElement("strong");
    name.textContent = item.nombre || "Producto";
    const meta = document.createElement("small");
    meta.textContent = item.marca || item.categoria || "Producto";
    info.append(name, meta);

    const price = document.createElement("span");
    price.className = "search-suggestion-price";
    price.textContent = formatMoney(item.precio);

    link.append(imageBox, info, price);
    fragment.appendChild(link);
  });

  searchSuggestions.appendChild(fragment);
  searchSuggestions.hidden = false;
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const query = searchInput.value.trim();
  window.location.href = query ? `/busqueda/?q=${encodeURIComponent(query)}` : "/";
}

async function init() {
  const id = getProductId();
  renderProductDetailSkeleton();
  products = await getProducts();
  product = products.find((item) => String(item.id) === String(id));
  favoritesDropdown = setupFavoritesDropdown({
    trigger: favoritesTrigger,
    products,
    getFavorites: () => favorites,
  });

  cartPanel = createCartPanel({
    cart,
    onClose: closeCartPanel,
    onChange(nextCart) {
      cart = nextCart;
      saveCart(cart);
      refreshCart();
    },
    onClear() {
      cart = [];
      saveCart(cart);
      refreshCart();
    },
  });
  cartMount.appendChild(cartPanel);
  refreshCart();

  if (!product) {
    mount.innerHTML = `
      <section class="catalog-section">
        <h1>Producto no encontrado</h1>
        <a class="primary-link" href="/">Volver al catalogo</a>
      </section>
    `;
    return;
  }

  saveRecentlyViewed(product);
  renderProductDetail(product);
}

searchForm?.addEventListener("submit", handleSearchSubmit);
searchInput?.addEventListener("input", renderSearchSuggestions);
searchInput?.addEventListener("focus", renderSearchSuggestions);
document.addEventListener("click", (event) => {
  if (searchForm?.contains(event.target)) return;
  hideSearchSuggestions();
});
openCartBtn?.addEventListener("click", () => openCartPanel("header"));
floatingCartBtn?.addEventListener("click", () => openCartPanel("floating"));
cartBackdrop?.addEventListener("click", closeCartPanel);
document.addEventListener("click", (event) => {
  if (!cartPanel?.classList.contains("is-open")) return;
  if (cartPanel.contains(event.target) || openCartBtn?.contains(event.target) || floatingCartBtn?.contains(event.target)) return;
  closeCartPanel();
});
window.addEventListener("scroll", updateHeaderState, { passive: true });
updateHeaderState();

init();
