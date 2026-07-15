import "../styles/base.css";
import "../styles/layout.css";
import { createProductForm } from "../components/product-form/product-form.js";
import { createCategoryForm } from "../components/category-form/category-form.js";
import { createBrandForm } from "../components/brand-form/brand-form.js";
import { createProductList } from "../components/product-list/product-list.js";
import { getBrands, getCategories, getProductStock, getProducts, sendAdminAction } from "../services/products-service.js";
import { storeConfig } from "../config.js";

let products = [];
let categories = [];
let brands = [];
let productForm = null;
let categoryForm = null;
let brandForm = null;
let selectedCategory = "";
let selectedBrand = "";
let selectedStatus = "active";
let adminSearchQuery = "";
let rowsPerPage = 10;
let currentPage = 1;

const productFormMount = document.getElementById("productFormMount");
const categoryFormMount = document.getElementById("categoryFormMount");
const brandFormMount = document.getElementById("brandFormMount");
const productListMount = document.getElementById("productListMount");
const newProductBtn = document.getElementById("newProductBtn");
const newCategoryBtn = document.getElementById("newCategoryBtn");
const newBrandBtn = document.getElementById("newBrandBtn");
const reloadProductsBtn = document.getElementById("reloadProductsBtn");
const manageStatus = document.getElementById("manageStatus");
const drawer = document.getElementById("productDrawer");
const categoryDrawer = document.getElementById("categoryDrawer");
const brandDrawer = document.getElementById("brandDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const closeCategoryDrawerBtn = document.getElementById("closeCategoryDrawerBtn");
const closeBrandDrawerBtn = document.getElementById("closeBrandDrawerBtn");
const drawerTitle = document.getElementById("drawerTitle");
const categoryDrawerTitle = document.getElementById("categoryDrawerTitle");
const brandDrawerTitle = document.getElementById("brandDrawerTitle");
const connectionStatus = document.getElementById("connectionStatus");
const categoryFilterList = document.getElementById("categoryFilterList");
const brandFilterList = document.getElementById("brandFilterList");
const adminSearchInput = document.getElementById("adminSearchInput");
const adminStatusTabs = document.querySelectorAll("[data-status-filter]");
const adminTitle = document.getElementById("adminTitle");
const adminRowsPerPage = document.getElementById("adminRowsPerPage");
const adminPageInfo = document.getElementById("adminPageInfo");
const adminPrevPageBtn = document.getElementById("adminPrevPageBtn");
const adminNextPageBtn = document.getElementById("adminNextPageBtn");
const sidePanelToggles = document.querySelectorAll("[data-side-toggle]");

function openDrawer(product = null) {
  productForm.setProduct(product);
  drawerTitle.textContent = product ? "Modificar producto" : "Nuevo producto";
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
}

function openCategoryDrawer(category = null) {
  categoryForm.setCategory(category);
  categoryDrawerTitle.textContent = category ? "Modificar categoria" : "Nueva categoria";
  categoryDrawer.classList.add("is-open");
  categoryDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
}

function openBrandDrawer(brand = null) {
  brandForm.setBrand(brand);
  brandDrawerTitle.textContent = brand ? "Modificar marca" : "Nueva marca";
  brandDrawer.classList.add("is-open");
  brandDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
}

function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  categoryDrawer.classList.remove("is-open");
  categoryDrawer.setAttribute("aria-hidden", "true");
  brandDrawer.classList.remove("is-open");
  brandDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
}

function getFilteredProducts() {
  return products.filter((product) => {
    const isActive = product.activo !== "NO";
    const isHidden = product.activo === "NO";
    const stock = getProductStock(product);
    const isLowStock = stock !== null && stock <= 5;
    const searchText = [product.id, product.nombre, product.categoria, product.marca].join(" ").toLowerCase();
    const matchesCategory = !selectedCategory || product.categoria === selectedCategory;
    const matchesBrand = !selectedBrand || product.marca === selectedBrand;
    const matchesSearch = !adminSearchQuery || searchText.includes(adminSearchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && isActive) ||
      (selectedStatus === "hidden" && isHidden) ||
      (selectedStatus === "low-stock" && isActive && isLowStock);
    return matchesStatus && matchesCategory && matchesBrand && matchesSearch;
  });
}

function updateStatusTabs() {
  adminStatusTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.statusFilter === selectedStatus);
  });
}

function resetPage() {
  currentPage = 1;
}

function renderCategoryFilters() {
  categoryFilterList.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.className = `category-filter ${selectedCategory ? "" : "is-active"}`;
  allButton.type = "button";
  allButton.textContent = "Todas";
  allButton.addEventListener("click", () => {
    selectedCategory = "";
    resetPage();
    renderCategoryFilters();
    renderList();
  });
  categoryFilterList.appendChild(allButton);

  categories.forEach((category) => {
    const row = document.createElement("div");
    row.className = `category-row ${category.activo === "NO" ? "is-muted" : ""}`;
    row.innerHTML = `
      <button class="category-filter ${selectedCategory === category.nombre ? "is-active" : ""}" type="button">
        ${category.nombre}
      </button>
      <button class="icon-button ghost-button" type="button" data-action="edit" title="Modificar">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
      <button class="icon-button ghost-button" type="button" data-action="toggle" title="${category.activo === "NO" ? "Activar" : "Desactivar"}">
        <i class="fa-solid ${category.activo === "NO" ? "fa-eye" : "fa-eye-slash"}"></i>
      </button>
    `;
    row.querySelector(".category-filter").addEventListener("click", () => {
      selectedCategory = category.nombre;
      resetPage();
      renderCategoryFilters();
      renderList();
    });
    row.querySelector('[data-action="edit"]').addEventListener("click", () => openCategoryDrawer(category));
    row.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleCategory(category));
    categoryFilterList.appendChild(row);
  });
}

function renderBrandFilters() {
  brandFilterList.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.className = `category-filter ${selectedBrand ? "" : "is-active"}`;
  allButton.type = "button";
  allButton.textContent = "Todas";
  allButton.addEventListener("click", () => {
    selectedBrand = "";
    resetPage();
    renderBrandFilters();
    renderList();
  });
  brandFilterList.appendChild(allButton);

  brands.forEach((brand) => {
    const row = document.createElement("div");
    row.className = `category-row ${brand.activo === "NO" ? "is-muted" : ""}`;
    row.innerHTML = `
      <button class="category-filter ${selectedBrand === brand.nombre ? "is-active" : ""}" type="button">
        ${brand.nombre}
      </button>
      <button class="icon-button ghost-button" type="button" data-action="edit" title="Modificar">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
      <button class="icon-button ghost-button" type="button" data-action="toggle" title="${brand.activo === "NO" ? "Activar" : "Desactivar"}">
        <i class="fa-solid ${brand.activo === "NO" ? "fa-eye" : "fa-eye-slash"}"></i>
      </button>
    `;
    row.querySelector(".category-filter").addEventListener("click", () => {
      selectedBrand = brand.nombre;
      resetPage();
      renderBrandFilters();
      renderList();
    });
    row.querySelector('[data-action="edit"]').addEventListener("click", () => openBrandDrawer(brand));
    row.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleBrand(brand));
    brandFilterList.appendChild(row);
  });
}

function renderList() {
  const filteredProducts = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  currentPage = Math.min(currentPage, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  const titleByStatus = {
    all: "Todos los productos",
    active: "Productos activos",
    hidden: "Productos ocultos",
    "low-stock": "Stock bajo",
  };
  productListMount.innerHTML = "";
  adminTitle.textContent = titleByStatus[selectedStatus] || "Inventario";
  productListMount.appendChild(createProductList(visibleProducts, sendManageAction));
  adminRowsPerPage.value = String(rowsPerPage);
  adminPrevPageBtn.disabled = currentPage <= 1;
  adminNextPageBtn.disabled = currentPage >= totalPages || !filteredProducts.length;
  adminPageInfo.textContent = filteredProducts.length
    ? `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, filteredProducts.length)} de ${filteredProducts.length}`
    : "0 productos";
  manageStatus.textContent = filteredProducts.length ? "" : "No hay productos para estos filtros.";
}

async function loadProducts() {
  manageStatus.textContent = "Cargando productos...";
  connectionStatus.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Conectando';

  try {
    [products, categories, brands] = await Promise.all([
      getProducts({ includeInactive: true }),
      getCategories({ includeInactive: true }),
      getBrands({ includeInactive: true }),
    ]);
    productForm.setCategories(categories);
    productForm.setBrands(brands);
    updateStatusTabs();
    renderCategoryFilters();
    renderBrandFilters();
    renderList();
    connectionStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Conectado a Google Sheets';
  } catch (error) {
    console.error("[admin] No se pudo cargar productos.", error);
    manageStatus.textContent = "No se pudo cargar productos. Revisa sheetCsvUrl o actualiza Apps Script.";
    connectionStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sin conexion';
  }
}

async function sendManageAction(payload) {
  if (payload.action === "edit") {
    openDrawer(payload.product);
    return;
  }

  manageStatus.textContent = "Enviando cambio...";
  try {
    await sendAdminAction({ ...payload, token: storeConfig.adminToken });
    manageStatus.textContent = "Cambio enviado. Recarga en unos segundos para ver el resultado.";
  } catch (error) {
    manageStatus.textContent = error.message;
  }
}

async function toggleCategory(category) {
  manageStatus.textContent = "Actualizando categoria...";

  try {
    await sendAdminAction({
      action: "set_category_active",
      token: storeConfig.adminToken,
      id: category.id,
      activo: category.activo === "NO" ? "SI" : "NO",
    });
    setTimeout(loadProducts, 800);
  } catch (error) {
    manageStatus.textContent = error.message;
  }
}

async function toggleBrand(brand) {
  manageStatus.textContent = "Actualizando marca...";

  try {
    await sendAdminAction({
      action: "set_brand_active",
      token: storeConfig.adminToken,
      id: brand.id,
      activo: brand.activo === "NO" ? "SI" : "NO",
    });
    setTimeout(loadProducts, 800);
  } catch (error) {
    manageStatus.textContent = error.message;
  }
}

productForm = createProductForm({
  getCategories() {
    return categories;
  },
  getToken() {
    return storeConfig.adminToken;
  },
  onSaved() {
    closeDrawer();
    setTimeout(loadProducts, 1500);
  },
});
productFormMount.appendChild(productForm.element);

categoryForm = createCategoryForm({
  getToken() {
    return storeConfig.adminToken;
  },
  onSaved() {
    closeDrawer();
    setTimeout(loadProducts, 800);
  },
});
categoryFormMount.appendChild(categoryForm.element);

brandForm = createBrandForm({
  getToken() {
    return storeConfig.adminToken;
  },
  onSaved() {
    closeDrawer();
    setTimeout(loadProducts, 800);
  },
});
brandFormMount.appendChild(brandForm.element);

newProductBtn.addEventListener("click", () => openDrawer());
newCategoryBtn.addEventListener("click", () => openCategoryDrawer());
newBrandBtn.addEventListener("click", () => openBrandDrawer());
closeDrawerBtn.addEventListener("click", closeDrawer);
closeCategoryDrawerBtn.addEventListener("click", closeDrawer);
closeBrandDrawerBtn.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);
reloadProductsBtn.addEventListener("click", loadProducts);
adminSearchInput.addEventListener("input", () => {
  adminSearchQuery = adminSearchInput.value.trim();
  resetPage();
  renderList();
});
adminStatusTabs.forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatus = button.dataset.statusFilter;
    resetPage();
    updateStatusTabs();
    renderList();
  });
});
adminRowsPerPage.addEventListener("change", () => {
  rowsPerPage = Number(adminRowsPerPage.value || 10);
  resetPage();
  renderList();
});
adminPrevPageBtn.addEventListener("click", () => {
  currentPage = Math.max(1, currentPage - 1);
  renderList();
});
adminNextPageBtn.addEventListener("click", () => {
  currentPage += 1;
  renderList();
});
sidePanelToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const panel = toggle.closest(".admin-filter-panel");
    if (!panel) return;
    const isOpen = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
});
loadProducts();
