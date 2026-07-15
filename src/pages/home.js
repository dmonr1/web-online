import "../styles/base.css";
import "../styles/layout.css";
import { setupFavoritesDropdown } from "../components/favorites-dropdown/favorites-dropdown.js";
import { createProductCard } from "../components/product-card/product-card.js";
import { createCartPanel, renderCart } from "../components/cart-panel/cart-panel.js";
import { addToCart, getCart, saveCart } from "../services/cart-service.js";
import { formatMoney, getProducts } from "../services/products-service.js";

let products = [];
let cart = getCart();
let cartPanel = null;
let favorites = getFavorites();
let showOnlyFavorites = false;
let priceFilter = { min: 0, max: 0 };
let activeSearchQuery = new URLSearchParams(window.location.search).get("q")?.trim() || "";
let activeCategoryQuery = new URLSearchParams(window.location.search).get("categoria")?.trim() || "";
let activeCategories = [];
let activeBrands = [];
const PRODUCTS_PAGE_SIZE = 20;
let visibleProductCount = PRODUCTS_PAGE_SIZE;

const productsGrid = document.getElementById("productsGrid");
const loadMoreProductsBtn = document.getElementById("loadMoreProductsBtn");
const storeHeader = document.querySelector(".store-header");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const categoryFilter = document.getElementById("categoryFilter");
const brandFilter = document.getElementById("brandFilter");
const sortFilter = document.getElementById("sortFilter");
const categoryCarousel = document.getElementById("categoryCarousel");
const brandOptions = document.getElementById("brandOptions");
const catalogTitle = document.getElementById("catalogTitle");
const emptyState = document.getElementById("emptyState");
const catalogSidebar = document.querySelector(".catalog-sidebar");
const cartMount = document.getElementById("cartMount");
const floatingCartBtn = document.getElementById("floatingCartBtn");
const openCartBtn = document.getElementById("openCartBtn");
const favoritesBtn = document.getElementById("favoritesBtn");
const cartBadge = document.getElementById("cartBadge");
const floatingCartBadge = document.getElementById("floatingCartBadge");
const cartBackdrop = document.getElementById("cartBackdrop");
const searchBreadcrumbCurrent = document.getElementById("searchBreadcrumbCurrent");
const priceSlider = document.querySelector(".price-slider");
const minPriceRange = document.getElementById("minPriceRange");
const maxPriceRange = document.getElementById("maxPriceRange");
const minPriceInput = document.getElementById("minPriceInput");
const maxPriceInput = document.getElementById("maxPriceInput");
const quickCategories = document.getElementById("quickCategories");
const popularProductsRail = document.getElementById("popularProductsRail");
const popularPrevBtn = document.getElementById("popularPrevBtn");
const popularNextBtn = document.getElementById("popularNextBtn");
const catalogLinks = document.querySelectorAll('a[href="#catalogo"]');
const dealsProductsRail = document.getElementById("dealsProductsRail");
const dealsPrevBtn = document.getElementById("dealsPrevBtn");
const dealsNextBtn = document.getElementById("dealsNextBtn");
const heroCarouselTrack = document.getElementById("heroCarouselTrack");
const heroCarouselDots = document.getElementById("heroCarouselDots");
const heroSlides = heroCarouselTrack ? [...heroCarouselTrack.querySelectorAll(".store-hero-slide")] : [];
const heroDots = heroCarouselDots ? [...heroCarouselDots.querySelectorAll("button")] : [];
const catalogSection = document.getElementById("catalogo");
const isSearchPage = document.body.dataset.page === "search";
let currentHeroSlide = 0;
let heroCarouselTimer = null;
let dealsCarouselTimer = null;
let customSelects = [];
let favoritesDropdown = null;
let selectedFiltersMount = null;
let heroDragStartX = 0;
let heroDragStartY = 0;
let heroDragPointerId = null;
let heroDragActive = false;
let heroDragMoved = false;

function showHeroSlide(index) {
  if (!heroSlides.length) return;
  currentHeroSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === currentHeroSlide);
  });
  heroDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === currentHeroSlide);
  });
}

function startHeroCarousel() {
  if (heroSlides.length < 2) return;
  window.clearInterval(heroCarouselTimer);
  heroCarouselTimer = window.setInterval(() => {
    showHeroSlide(currentHeroSlide + 1);
  }, 5000);
}

function resetHeroDrag() {
  heroDragPointerId = null;
  heroDragActive = false;
  heroDragMoved = false;
  heroCarouselTrack?.classList.remove("is-dragging");
}

function handleHeroDragStart(event) {
  if (heroSlides.length < 2 || event.button > 0) return;
  heroDragPointerId = event.pointerId;
  heroDragStartX = event.clientX;
  heroDragStartY = event.clientY;
  heroDragActive = true;
  heroDragMoved = false;
  heroCarouselTrack?.classList.add("is-dragging");
  heroCarouselTrack?.setPointerCapture?.(event.pointerId);
  window.clearInterval(heroCarouselTimer);
}

function handleHeroDragMove(event) {
  if (!heroDragActive || event.pointerId !== heroDragPointerId) return;
  const distanceX = event.clientX - heroDragStartX;
  const distanceY = event.clientY - heroDragStartY;
  if (Math.abs(distanceX) > 8 && Math.abs(distanceX) > Math.abs(distanceY)) {
    heroDragMoved = true;
    event.preventDefault();
  }
}

function handleHeroDragEnd(event) {
  if (!heroDragActive || event.pointerId !== heroDragPointerId) return;
  const distanceX = event.clientX - heroDragStartX;
  const threshold = Math.min(120, Math.max(46, (heroCarouselTrack?.clientWidth || 320) * 0.12));

  if (Math.abs(distanceX) >= threshold) {
    showHeroSlide(currentHeroSlide + (distanceX < 0 ? 1 : -1));
  }

  heroCarouselTrack?.releasePointerCapture?.(event.pointerId);
  resetHeroDrag();
  startHeroCarousel();
}

function scrollRail(rail, direction = 1) {
  if (!rail) return;
  const card = rail.firstElementChild;
  const step = card ? card.getBoundingClientRect().width + 22 : 360;
  const nextLeft = rail.scrollLeft + step * direction;
  const maxLeft = rail.scrollWidth - rail.clientWidth - 4;

  rail.scrollTo({
    left: direction > 0 && nextLeft >= maxLeft ? 0 : Math.max(0, nextLeft),
    behavior: "smooth",
  });
}

function scrollDeals(direction = 1) {
  scrollRail(dealsProductsRail, direction);
}

function startDealsCarousel() {
  if (!dealsProductsRail || dealsProductsRail.children.length < 2) return;
  window.clearInterval(dealsCarouselTimer);
  dealsCarouselTimer = window.setInterval(() => scrollDeals(1), 4500);
}

function updateHeaderState() {
  const currentScrollY = window.scrollY;
  const isAwayFromTop = currentScrollY > 90;
  storeHeader?.classList.toggle("is-scrolled", currentScrollY > 12);
  storeHeader?.classList.toggle("is-hidden", isAwayFromTop);
  floatingCartBtn?.classList.toggle("is-visible", isAwayFromTop);
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

function matchesSearchText(product, query) {
  if (!query) return true;
  const text = [product.nombre, product.descripcion, product.categoria, product.marca].join(" ").toLowerCase();
  return text.includes(query.toLowerCase());
}

function getSearchMatches(query) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];
  return products.filter((product) => matchesSearchText(product, normalizedQuery)).slice(0, 6);
}

function hideSearchSuggestions() {
  if (!searchSuggestions) return;
  searchSuggestions.hidden = true;
  searchSuggestions.innerHTML = "";
}

function renderSearchSuggestions() {
  if (!searchSuggestions || !searchInput) return;
  const query = searchInput.value.trim();
  const matches = getSearchMatches(query);

  if (!matches.length) {
    hideSearchSuggestions();
    return;
  }

  searchSuggestions.innerHTML = "";
  const fragment = document.createDocumentFragment();
  matches.forEach((product) => {
    const link = document.createElement("a");
    link.className = "search-suggestion";
    link.href = `/producto/?id=${encodeURIComponent(product.id)}`;

    const imageBox = document.createElement("span");
    imageBox.className = "search-suggestion-image";
    if (product.imagen_url) {
      const image = document.createElement("img");
      image.src = product.imagen_url;
      image.alt = "";
      imageBox.appendChild(image);
    }

    const info = document.createElement("span");
    info.className = "search-suggestion-info";
    const name = document.createElement("strong");
    name.textContent = product.nombre || "Producto";
    const meta = document.createElement("small");
    meta.textContent = product.marca || product.categoria || "Producto";
    info.append(name, meta);

    const price = document.createElement("span");
    price.className = "search-suggestion-price";
    price.textContent = formatMoney(product.precio);

    link.append(imageBox, info, price);
    fragment.appendChild(link);
  });

  searchSuggestions.appendChild(fragment);
  searchSuggestions.hidden = false;
}

function getFilteredProducts() {
  const query = getEffectiveSearchQuery();

  return products.filter((product) => {
    const price = Number(product.precio || 0);
    const matchesFavorite = !showOnlyFavorites || favorites.includes(String(product.id));
    const matchesPrice = price >= priceFilter.min && price <= priceFilter.max;
    return (
      matchesSearchText(product, query) &&
      (!activeCategories.length || activeCategories.includes(product.categoria)) &&
      (!activeBrands.length || activeBrands.includes(product.marca)) &&
      matchesFavorite &&
      matchesPrice
    );
  });
}

function sortProducts(items) {
  const sortValue = sortFilter?.value || "relevance";
  if (sortValue === "price-desc") {
    return [...items].sort((first, second) => Number(second.precio || 0) - Number(first.precio || 0));
  }
  if (sortValue === "price-asc") {
    return [...items].sort((first, second) => Number(first.precio || 0) - Number(second.precio || 0));
  }
  return items;
}

function hasActiveCatalogFilters() {
  return activeCategories.length > 0 || activeBrands.length > 0 || isPriceFiltered();
}

function getEffectiveSearchQuery() {
  if (!isSearchPage || hasActiveCatalogFilters()) return "";
  return activeSearchQuery;
}

function clearSearchContextForFilters() {
  hideSearchSuggestions();
}

function updatePriceLabels() {
  if (minPriceInput) minPriceInput.value = String(priceFilter.min);
  if (maxPriceInput) maxPriceInput.value = String(priceFilter.max);
  updatePriceTrack();
}

function updatePriceTrack() {
  if (!priceSlider || !minPriceRange || !maxPriceRange) return;
  const minLimit = Number(minPriceRange.min || 0);
  const maxLimit = Number(maxPriceRange.max || 0);
  const total = maxLimit - minLimit || 1;
  const start = ((priceFilter.min - minLimit) / total) * 100;
  const end = ((priceFilter.max - minLimit) / total) * 100;
  priceSlider.style.setProperty("--range-start", `${start}%`);
  priceSlider.style.setProperty("--range-end", `${end}%`);
}

function setupPriceFilter() {
  if (!minPriceRange || !maxPriceRange) return;
  const prices = products.map((product) => Number(product.precio || 0)).filter(Number.isFinite);
  const min = Math.floor(Math.min(...prices, 0));
  const max = Math.ceil(Math.max(...prices, 0));
  priceFilter = { min, max };

  [minPriceRange, maxPriceRange, minPriceInput, maxPriceInput].filter(Boolean).forEach((input) => {
    input.min = String(min);
    input.max = String(max);
    input.step = "10";
  });

  minPriceRange.value = String(min);
  maxPriceRange.value = String(max);
  updatePriceLabels();
}

function getDefaultPriceRange() {
  return {
    min: Number(minPriceRange?.min || 0),
    max: Number(maxPriceRange?.max || 0),
  };
}

function isPriceFiltered() {
  const defaultRange = getDefaultPriceRange();
  return priceFilter.min > defaultRange.min || priceFilter.max < defaultRange.max;
}

function createSelectedFiltersMount() {
  if (!catalogSidebar || selectedFiltersMount) return;
  selectedFiltersMount = document.createElement("div");
  selectedFiltersMount.className = "selected-filters";
  catalogSidebar.querySelector(".catalog-sidebar-head")?.after(selectedFiltersMount);
}

function renderSelectedFilters() {
  if (!selectedFiltersMount) return;

  const selectedFilters = [];
  activeCategories.forEach((category) => selectedFilters.push({ type: "category", value: category, label: category }));
  activeBrands.forEach((brand) => selectedFilters.push({ type: "brand", value: brand, label: brand }));
  if (isPriceFiltered()) {
    selectedFilters.push({
      type: "price",
      label: `${formatMoney(priceFilter.min)} - ${formatMoney(priceFilter.max)}`,
    });
  }

  selectedFiltersMount.innerHTML = "";
  selectedFiltersMount.hidden = selectedFilters.length === 0;
  if (!selectedFilters.length) return;

  const title = document.createElement("span");
  title.className = "selected-filters-title";
  title.textContent = "Filtros seleccionados";
  selectedFiltersMount.appendChild(title);

  const list = document.createElement("div");
  list.className = "selected-filters-list";
  selectedFilters.forEach((filter) => {
    const chip = document.createElement("button");
    chip.className = "selected-filter-chip";
    chip.type = "button";
    chip.dataset.filterType = filter.type;
    if (filter.value) chip.dataset.filterValue = filter.value;
    chip.innerHTML = `<span>${filter.label}</span><i class="fa-solid fa-xmark" aria-hidden="true"></i>`;
    list.appendChild(chip);
  });

  const clearButton = document.createElement("button");
  clearButton.className = "selected-filters-clear";
  clearButton.type = "button";
  clearButton.dataset.filterType = "all";
  clearButton.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i><span>Quitar filtros</span>';

  selectedFiltersMount.append(list, clearButton);
}

function clearPriceFilter() {
  const defaultRange = getDefaultPriceRange();
  priceFilter = defaultRange;
  if (minPriceRange) minPriceRange.value = String(defaultRange.min);
  if (maxPriceRange) maxPriceRange.value = String(defaultRange.max);
  updatePriceLabels();
}

function clearSelectedFilter(type, value = "") {
  if (type === "category") selectCategory(value, { selected: false });
  if (type === "brand") selectBrand(value, { selected: false });
  if (type === "all") {
    selectCategory("");
    selectBrand("");
  }
  if (type === "price" || type === "all") {
    clearPriceFilter();
    resetVisibleProducts();
    renderSelectedFilters();
    renderProducts();
  }
}

function handlePriceInput(event) {
  clearSearchContextForFilters();
  let min = Number(minPriceRange.value);
  let max = Number(maxPriceRange.value);

  if (min > max) {
    if (event.target === minPriceRange) {
      max = min;
    } else {
      min = max;
    }
  }

  minPriceRange.value = String(min);
  maxPriceRange.value = String(max);
  priceFilter = { min, max };
  updatePriceLabels();
  resetVisibleProducts();
  renderSelectedFilters();
  renderProducts();
}

function handlePriceTextInput(event) {
  clearSearchContextForFilters();
  let min = Number(minPriceInput.value || 0);
  let max = Number(maxPriceInput.value || 0);
  const lowerLimit = Number(minPriceRange.min || 0);
  const upperLimit = Number(maxPriceRange.max || 0);

  min = Math.max(lowerLimit, Math.min(min, upperLimit));
  max = Math.max(lowerLimit, Math.min(max, upperLimit));

  if (min > max) {
    if (event.target === minPriceInput) {
      max = min;
    } else {
      min = max;
    }
  }

  minPriceRange.value = String(min);
  maxPriceRange.value = String(max);
  priceFilter = { min, max };
  updatePriceLabels();
  resetVisibleProducts();
  renderSelectedFilters();
  renderProducts();
}

function renderCategories() {
  const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
  const brands = [...new Set(products.map((product) => product.marca).filter(Boolean))];
  const categoryCounts = products.reduce((counts, product) => {
    const category = product.categoria || "Sin categoria";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  categoryFilter.innerHTML = '<option value="">Seleccione</option>';
  brandFilter.innerHTML = '<option value="">Seleccione</option>';
  categoryCarousel.innerHTML = "";
  brandOptions.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);

    const button = document.createElement("button");
    button.className = "filter-option";
    button.type = "button";
    button.innerHTML = `<span>${category}</span><strong>${categoryCounts[category] || 0}</strong>`;
    button.dataset.category = category;
    categoryCarousel.appendChild(button);
  });

  brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);

    const button = document.createElement("button");
    const count = products.filter((product) => product.marca === brand).length;
    button.className = "filter-option";
    button.type = "button";
    button.innerHTML = `<span>${brand}</span><strong>${count}</strong>`;
    button.dataset.brand = brand;
    brandOptions.appendChild(button);
  });

  if (activeCategoryQuery && categories.includes(activeCategoryQuery)) {
    selectCategory(activeCategoryQuery);
    activeCategoryQuery = "";
  }

  setupCatalogDropdowns();
}

function closeCatalogDropdowns(exceptDropdown = null) {
  customSelects.forEach(({ dropdown }) => {
    if (dropdown === exceptDropdown) return;
    dropdown.classList.remove("is-open");
    dropdown.querySelector(".custom-select-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function updateCustomDropdown(select) {
  const dropdown = select.closest(".custom-select") || document.querySelector(`.custom-select[data-select-id="${select.id}"]`);
  if (!dropdown) return;
  const selected = select.selectedOptions[0];
  const defaultLabels = {
    categoryFilter: "Categorias",
    brandFilter: "Marcas",
    sortFilter: "Relevancia",
  };
  const defaultLabel = defaultLabels[select.id] || "Seleccione";
  const label = dropdown.querySelector("[data-custom-select-label]");
  if (label) label.textContent = select.value ? selected?.textContent || "" : defaultLabel;
  dropdown.querySelectorAll(".custom-select-option").forEach((option) => {
    const isSelected = option.dataset.value === select.value;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });
}

function createCustomDropdown(select) {
  const dropdown = document.createElement("div");
  dropdown.className = "custom-select";
  dropdown.dataset.selectId = select.id;
  const iconClasses = {
    categoryFilter: "fa-layer-group",
    brandFilter: "fa-tag",
    sortFilter: "fa-arrow-down-wide-short",
  };
  const iconClass = iconClasses[select.id] || "fa-chevron-down";

  const trigger = document.createElement("button");
  trigger.className = "custom-select-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = `
    <span class="custom-select-value">
      <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
      <span data-custom-select-label></span>
    </span>
    <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
  `;

  const menu = document.createElement("div");
  menu.className = "custom-select-menu";
  menu.setAttribute("role", "listbox");

  [...select.options].forEach((selectOption) => {
    const option = document.createElement("button");
    option.className = "custom-select-option";
    option.type = "button";
    option.dataset.value = selectOption.value;
    option.setAttribute("role", "option");
    option.innerHTML = `<span>${selectOption.textContent}</span>`;
    option.addEventListener("click", () => {
      if (select.id === "categoryFilter") {
        selectCategory(selectOption.value);
      } else if (select.id === "brandFilter") {
        selectBrand(selectOption.value);
      } else if (select.id === "sortFilter") {
        select.value = selectOption.value;
        updateCustomDropdown(select);
        resetVisibleProducts();
        renderProducts();
      } else {
        select.value = selectOption.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeCatalogDropdowns();
    });
    menu.appendChild(option);
  });

  trigger.addEventListener("click", () => {
    const shouldOpen = !dropdown.classList.contains("is-open");
    closeCatalogDropdowns(dropdown);
    dropdown.classList.toggle("is-open", shouldOpen);
    trigger.setAttribute("aria-expanded", String(shouldOpen));
  });

  dropdown.append(trigger, menu);
  select.insertAdjacentElement("afterend", dropdown);
  updateCustomDropdown(select);
  return dropdown;
}

function setupCatalogDropdowns() {
  document.querySelectorAll(".custom-select").forEach((dropdown) => dropdown.remove());
  customSelects = [categoryFilter, brandFilter, sortFilter].filter(Boolean).map((select) => {
    select.classList.add("native-filter-select");
    return { select, dropdown: createCustomDropdown(select) };
  });
}

function createProductSkeleton() {
  const skeleton = document.createElement("article");
  skeleton.className = "product-card product-card-skeleton";
  skeleton.innerHTML = `
    <div class="skeleton-media"></div>
    <div class="skeleton-info">
      <span></span>
      <strong></strong>
      <div>
        <b></b>
        <em></em>
      </div>
    </div>
  `;
  return skeleton;
}

function renderProductSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  Array.from({ length: count }).forEach(() => fragment.appendChild(createProductSkeleton()));
  container.appendChild(fragment);
}

function renderHomeSkeletons() {
  if (quickCategories) {
    quickCategories.innerHTML = "";
    const fragment = document.createDocumentFragment();
    Array.from({ length: 6 }).forEach(() => {
      const chip = document.createElement("span");
      chip.className = "quick-category-card quick-category-skeleton";
      chip.innerHTML = "<i></i><strong></strong><small></small>";
      fragment.appendChild(chip);
    });
    quickCategories.appendChild(fragment);
  }

  renderProductSkeletons(popularProductsRail, 6);

  if (dealsProductsRail) {
    dealsProductsRail.innerHTML = "";
    const fragment = document.createDocumentFragment();
    Array.from({ length: 5 }).forEach(() => {
      const banner = document.createElement("span");
      banner.className = "offer-banner-card offer-banner-skeleton";
      banner.innerHTML = "<i></i><strong></strong><small></small><b></b>";
      fragment.appendChild(banner);
    });
    dealsProductsRail.appendChild(fragment);
  }
}

function getCategoryIcon(category) {
  const value = category.toLowerCase();
  if (value.includes("monitor")) return "fa-display";
  if (value.includes("teclado")) return "fa-keyboard";
  if (value.includes("mouse")) return "fa-computer-mouse";
  if (value.includes("almacen")) return "fa-hard-drive";
  if (value.includes("memoria") || value.includes("ram")) return "fa-memory";
  if (value.includes("audio") || value.includes("audif")) return "fa-headphones";
  if (value.includes("procesador")) return "fa-microchip";
  return "fa-bolt";
}

function renderQuickCategories() {
  if (!quickCategories) return;
  const categoryCounts = products.reduce((counts, product) => {
    const category = product.categoria || "Sin categoria";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const categories = Object.entries(categoryCounts)
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 6);

  quickCategories.innerHTML = "";
  const fragment = document.createDocumentFragment();
  categories.forEach(([category, count]) => {
    const link = document.createElement("a");
      link.className = "quick-category-card";
      link.href = `/busqueda/?categoria=${encodeURIComponent(category)}`;
      link.innerHTML = `
      <span class="quick-category-icon"><i class="fa-solid ${getCategoryIcon(category)}"></i></span>
      <strong>${category}</strong>
      <small>${count}</small>
    `;
    fragment.appendChild(link);
  });
  quickCategories.appendChild(fragment);
}

function renderProductRail(container, items) {
  if (!container) return;
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  items.forEach((product) => {
    fragment.appendChild(
      createProductCard(product, handleAddToCart, {
        isFavorite: favorites.includes(String(product.id)),
        onFavoriteToggle: toggleFavorite,
      }),
    );
  });
  container.appendChild(fragment);
}

function renderOfferBanners(items) {
  if (!dealsProductsRail) return;
  const accents = [
    { className: "is-green", text: "Precio ideal para renovar tu setup." },
    { className: "is-rose", text: "Aprovecha antes de que se agote." },
    { className: "is-yellow", text: "Una compra inteligente para tu equipo." },
    { className: "is-blue", text: "Mejora tu rendimiento con una buena eleccion." },
    { className: "is-lilac", text: "Un extra para completar tu estacion de trabajo." },
  ];

  dealsProductsRail.innerHTML = "";
  const fragment = document.createDocumentFragment();
  items.slice(0, 5).forEach((product, index) => {
    const accent = accents[index % accents.length];
    const link = document.createElement("a");
      link.className = `offer-banner-card ${accent.className}`;
      link.href = `/producto/?id=${encodeURIComponent(product.id)}`;
      link.innerHTML = `
      <span class="offer-pill">${product.categoria || "Oferta"}</span>
      <strong>${product.nombre || "Producto destacado"}</strong>
      <small>${accent.text}</small>
      <b>${formatMoney(product.precio)}</b>
      <span class="offer-action" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
      ${product.imagen_url ? `<img src="${product.imagen_url}" alt="" loading="lazy" />` : ""}
    `;
    fragment.appendChild(link);
  });
  dealsProductsRail.appendChild(fragment);
  startDealsCarousel();
}

function renderHomeHighlights() {
  if (isSearchPage) return;
  renderQuickCategories();

  const inStockProducts = products.filter((product) => Number(product.stock || 0) > 0);
  const popularProducts = [...inStockProducts]
    .sort((first, second) => Number(second.stock || 0) - Number(first.stock || 0))
    .slice(0, 8);
  const dealsProducts = [...inStockProducts]
    .sort((first, second) => Number(first.precio || 0) - Number(second.precio || 0))
    .slice(0, 5);

  renderProductRail(popularProductsRail, popularProducts);
  renderOfferBanners(dealsProducts);
}

function renderProducts() {
  const filteredProducts = sortProducts(getFilteredProducts());
  const visibleProducts = filteredProducts.slice(0, visibleProductCount);
  const effectiveSearchQuery = getEffectiveSearchQuery();
  productsGrid.innerHTML = "";
  emptyState.hidden = filteredProducts.length > 0;
  if (loadMoreProductsBtn) {
    loadMoreProductsBtn.hidden = visibleProducts.length >= filteredProducts.length;
  }
  if (isSearchPage) {
    catalogTitle.textContent = effectiveSearchQuery
      ? `Resultados para "${effectiveSearchQuery}"`
      : activeCategories.length === 1
        ? activeCategories[0]
        : activeCategories.length > 1
          ? `${activeCategories.length} categorias seleccionadas`
        : "Resultados de busqueda";
    if (searchBreadcrumbCurrent) searchBreadcrumbCurrent.textContent = catalogTitle.textContent;
  } else {
    catalogTitle.textContent = showOnlyFavorites
      ? "Mis favoritos"
      : activeCategories.length === 1
        ? activeCategories[0]
        : activeCategories.length > 1
          ? `${activeCategories.length} categorias seleccionadas`
          : "Todos los productos";
  }

  const fragment = document.createDocumentFragment();
  visibleProducts.forEach((product, index) => {
    fragment.appendChild(
      createProductCard(product, handleAddToCart, {
        isFavorite: favorites.includes(String(product.id)),
        onFavoriteToggle: toggleFavorite,
        searchMatch: isSearchPage && effectiveSearchQuery && matchesSearchText(product, effectiveSearchQuery),
        animationDelay: index * 45,
      }),
    );
  });
  productsGrid.appendChild(fragment);
}

function resetVisibleProducts() {
  visibleProductCount = PRODUCTS_PAGE_SIZE;
}

function selectCategory(category, { selected } = {}) {
  clearSearchContextForFilters();
  if (!category) {
    activeCategories = [];
  } else if (selected === false) {
    activeCategories = activeCategories.filter((item) => item !== category);
  } else if (selected === true) {
    activeCategories = activeCategories.includes(category) ? activeCategories : [...activeCategories, category];
  } else {
    activeCategories = [category];
  }

  categoryFilter.value = activeCategories.length === 1 ? activeCategories[0] : "";
  categoryCarousel.querySelectorAll(".filter-option").forEach((option) => {
    option.classList.toggle("is-active", activeCategories.includes(option.dataset.category));
  });
  updateCustomDropdown(categoryFilter);
  resetVisibleProducts();
  renderSelectedFilters();
  renderProducts();
}

function selectBrand(brand, { selected } = {}) {
  clearSearchContextForFilters();
  if (!brand) {
    activeBrands = [];
  } else if (selected === false) {
    activeBrands = activeBrands.filter((item) => item !== brand);
  } else if (selected === true) {
    activeBrands = activeBrands.includes(brand) ? activeBrands : [...activeBrands, brand];
  } else {
    activeBrands = [brand];
  }

  brandFilter.value = activeBrands.length === 1 ? activeBrands[0] : "";
  brandOptions.querySelectorAll(".filter-option").forEach((option) => {
    option.classList.toggle("is-active", activeBrands.includes(option.dataset.brand));
  });
  updateCustomDropdown(brandFilter);
  resetVisibleProducts();
  renderSelectedFilters();
  renderProducts();
}

function handleAddToCart(product) {
  if (Number(product.stock || 0) <= 0) return;
  cart = addToCart(cart, product);
  saveCart(cart);
  refreshCart();
  openCartBtn.classList.remove("is-bumping");
  floatingCartBtn.classList.remove("is-bumping");
  void openCartBtn.offsetWidth;
  void floatingCartBtn.offsetWidth;
  openCartBtn.classList.add("is-bumping");
  floatingCartBtn.classList.add("is-bumping");
}

function toggleFavorite(product) {
  const productId = String(product.id);
  const exists = favorites.includes(productId);
  favorites = exists ? favorites.filter((id) => id !== productId) : [...favorites, productId];
  saveFavorites();
  updateFavoritesButton();
  favoritesDropdown?.render();
  if (showOnlyFavorites) {
    resetVisibleProducts();
    renderProducts();
  }
  return !exists;
}

function updateFavoritesButton() {
  favoritesBtn.classList.toggle("is-active", showOnlyFavorites);
  favoritesBtn.setAttribute("aria-label", showOnlyFavorites ? `Ver todos los productos. ${favorites.length} favoritos` : "Ver favoritos");
  favoritesBtn.querySelector("i").className = showOnlyFavorites ? "fa-solid fa-heart" : "fa-regular fa-heart";
  favoritesBtn.querySelector("span").textContent = showOnlyFavorites ? `Favoritos (${favorites.length})` : "Favoritos";
}

function scrollToCatalog() {
  catalogSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    window.location.href = "/";
    return;
  }
  window.location.href = `/busqueda/?q=${encodeURIComponent(query)}`;
}

function refreshCart() {
  cart = cart.map((item) => {
    const product = products.find((currentProduct) => String(currentProduct.id) === String(item.id));
    return {
      ...item,
      imagen_url: product?.imagen_url || item.imagen_url || "",
    };
  });
  saveCart(cart);
  renderCart(cartPanel, cart);
  const itemCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  cartBadge.textContent = itemCount;
  floatingCartBadge.textContent = itemCount;
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

async function init() {
  if (searchInput) searchInput.value = activeSearchQuery;
  renderProductSkeletons(productsGrid, isSearchPage ? 12 : 10);
  if (!isSearchPage) renderHomeSkeletons();
  products = await getProducts();
  createSelectedFiltersMount();
  renderCategories();
  renderHomeHighlights();
  setupPriceFilter();
  renderSelectedFilters();
  renderProducts();
  if (isSearchPage) {
    favoritesDropdown = setupFavoritesDropdown({
      trigger: favoritesBtn,
      products,
      getFavorites: () => favorites,
    });
  }

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
}

searchForm?.addEventListener("submit", handleSearchSubmit);
searchInput?.addEventListener("input", renderSearchSuggestions);
searchInput?.addEventListener("focus", renderSearchSuggestions);
document.addEventListener("click", (event) => {
  if (searchForm?.contains(event.target)) return;
  hideSearchSuggestions();
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".custom-select")) return;
  closeCatalogDropdowns();
});
minPriceRange?.addEventListener("input", handlePriceInput);
maxPriceRange?.addEventListener("input", handlePriceInput);
minPriceInput?.addEventListener("change", handlePriceTextInput);
maxPriceInput?.addEventListener("change", handlePriceTextInput);
categoryFilter.addEventListener("change", () => selectCategory(categoryFilter.value));
brandFilter.addEventListener("change", () => selectBrand(brandFilter.value));
categoryCarousel.addEventListener("click", (event) => {
  const option = event.target.closest(".filter-option");
  if (!option) return;
  selectCategory(option.dataset.category, { selected: !option.classList.contains("is-active") });
});
brandOptions.addEventListener("click", (event) => {
  const option = event.target.closest(".filter-option");
  if (!option) return;
  selectBrand(option.dataset.brand, { selected: !option.classList.contains("is-active") });
});
document.addEventListener("click", (event) => {
  const button = event.target.closest(".selected-filters [data-filter-type]");
  if (!button) return;
  clearSelectedFilter(button.dataset.filterType, button.dataset.filterValue);
});
if (!isSearchPage) {
  favoritesBtn.addEventListener("click", () => {
    favoritesBtn.classList.remove("is-clicking");
    void favoritesBtn.offsetWidth;
    favoritesBtn.classList.add("is-clicking");
    showOnlyFavorites = !showOnlyFavorites;
    updateFavoritesButton();
    resetVisibleProducts();
    renderProducts();
    window.requestAnimationFrame(scrollToCatalog);
  });
}
loadMoreProductsBtn?.addEventListener("click", () => {
  visibleProductCount += PRODUCTS_PAGE_SIZE;
  renderProducts();
});
catalogLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    scrollToCatalog();
  });
});
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-filter-toggle]");
  if (!trigger) return;
  const currentGroup = trigger.closest(".filter-group");
  const accordion = trigger.closest(".filter-accordion");
  if (!currentGroup || !accordion) return;

  const shouldOpen = !currentGroup.classList.contains("is-open");
  if (shouldOpen) {
    const openGroups = [...accordion.querySelectorAll(".filter-group.is-open")].filter((group) => group !== currentGroup);
    if (openGroups.length >= 2) openGroups[0].classList.remove("is-open");
  }
  currentGroup.classList.toggle("is-open", shouldOpen);
});
heroCarouselDots?.addEventListener("click", (event) => {
  const dot = event.target.closest("button");
  if (!dot) return;
  showHeroSlide(Number(dot.dataset.slide));
  startHeroCarousel();
});
heroCarouselTrack?.addEventListener("pointerdown", handleHeroDragStart);
heroCarouselTrack?.addEventListener("pointermove", handleHeroDragMove);
heroCarouselTrack?.addEventListener("pointerup", handleHeroDragEnd);
heroCarouselTrack?.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== heroDragPointerId) return;
  resetHeroDrag();
  startHeroCarousel();
});
heroCarouselTrack?.addEventListener("click", (event) => {
  if (!heroDragMoved) return;
  event.preventDefault();
  event.stopPropagation();
  heroDragMoved = false;
});
popularPrevBtn?.addEventListener("click", () => scrollRail(popularProductsRail, -1));
popularNextBtn?.addEventListener("click", () => scrollRail(popularProductsRail, 1));
dealsPrevBtn?.addEventListener("click", () => {
  scrollDeals(-1);
  startDealsCarousel();
});
dealsNextBtn?.addEventListener("click", () => {
  scrollDeals(1);
  startDealsCarousel();
});
openCartBtn.addEventListener("click", () => openCartPanel("header"));
floatingCartBtn.addEventListener("click", () => openCartPanel("floating"));
cartBackdrop?.addEventListener("click", closeCartPanel);
document.addEventListener("click", (event) => {
  if (!cartPanel?.classList.contains("is-open")) return;
  if (cartPanel.contains(event.target) || openCartBtn.contains(event.target) || floatingCartBtn.contains(event.target)) return;
  closeCartPanel();
});
window.addEventListener("scroll", updateHeaderState, { passive: true });
startHeroCarousel();
updateFavoritesButton();
updateHeaderState();
init();
