import template from "./product-form.html?raw";
import "./product-form.css";
import { hasCloudinaryUploadConfig, uploadProductImage } from "../../services/cloudinary-service.js";
import { sendAdminAction } from "../../services/products-service.js";

export function createProductForm({ getCategories, getToken, onSaved }) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const form = wrapper.firstElementChild;
  const status = form.querySelector("[data-status]");
  const categorySelect = form.querySelector("[data-category-select]");
  const brandSelect = form.querySelector("[data-brand-select]");
  const imageFileInput = form.querySelector("[data-image-file]");
  const extraImageFileInputs = [...form.querySelectorAll("[data-extra-image-file]")];
  const imageUrlInput = form.querySelector("[data-image-url]");
  const imagePreview = form.querySelector("[data-image-preview]");
  const imageEmpty = form.querySelector("[data-image-empty]");
  const uploadStatus = form.querySelector("[data-upload-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  let mode = "create";
  let categories = [];
  let brands = [];
  let isUploadingImage = false;

  function setImagePreview(url) {
    imagePreview.hidden = !url;
    imageEmpty.hidden = Boolean(url);
    if (url) imagePreview.src = url;
  }

  function renderCategories(selectedCategory = "") {
    categorySelect.innerHTML = '<option value="">Selecciona una categoria</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.nombre;
      option.textContent = category.nombre;
      categorySelect.appendChild(option);
    });
    categorySelect.value = selectedCategory;
  }

  function renderBrands(selectedBrand = "") {
    brandSelect.innerHTML = '<option value="">Selecciona una marca</option>';
    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand.nombre;
      option.textContent = brand.nombre;
      brandSelect.appendChild(option);
    });
    brandSelect.value = selectedBrand;
  }

  imageFileInput.disabled = !hasCloudinaryUploadConfig();
  extraImageFileInputs.forEach((input) => {
    input.disabled = !hasCloudinaryUploadConfig();
  });
  uploadStatus.textContent = hasCloudinaryUploadConfig() ? "" : "Cloudinary no esta configurado.";

  imageFileInput.addEventListener("change", async () => {
    const file = imageFileInput.files?.[0];
    if (!file) return;

    isUploadingImage = true;
    submitButton.disabled = true;
    uploadStatus.textContent = "Subiendo imagen...";

    try {
      const imageUrl = await uploadProductImage(file);
      imageUrlInput.value = imageUrl;
      setImagePreview(imageUrl);
      uploadStatus.textContent = "Imagen subida correctamente.";
    } catch (error) {
      uploadStatus.textContent = error.message;
    } finally {
      isUploadingImage = false;
      submitButton.disabled = false;
    }
  });

  extraImageFileInputs.forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      const targetInput = form.elements[input.dataset.target];
      if (!file || !targetInput) return;

      isUploadingImage = true;
      submitButton.disabled = true;
      uploadStatus.textContent = `Subiendo ${input.dataset.target.replace("_url", "").replaceAll("_", " ")}...`;

      try {
        targetInput.value = await uploadProductImage(file);
        uploadStatus.textContent = "Imagen extra subida correctamente.";
      } catch (error) {
        uploadStatus.textContent = error.message;
      } finally {
        isUploadingImage = false;
        submitButton.disabled = false;
      }
    });
  });

  imageUrlInput.addEventListener("input", () => {
    setImagePreview(imageUrlInput.value.trim());
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isUploadingImage) {
      status.textContent = "Espera a que termine de subir la imagen.";
      return;
    }

    const data = new FormData(form);
    status.textContent = "Guardando producto...";

    try {
      await sendAdminAction({
        action: mode === "edit" ? "update_product" : "create",
        token: getToken(),
        id: data.get("id"),
        nombre: data.get("nombre"),
        categoria: data.get("categoria"),
        marca: data.get("marca"),
        precio: data.get("precio"),
        stock: data.get("stock"),
        imagen_url: data.get("imagen_url"),
        imagen_2_url: data.get("imagen_2_url"),
        imagen_3_url: data.get("imagen_3_url"),
        imagen_4_url: data.get("imagen_4_url"),
        imagen_5_url: data.get("imagen_5_url"),
        descripcion: data.get("descripcion"),
        activo: form.activo.checked ? "SI" : "NO",
      });

      form.reset();
      form.activo.checked = true;
      setImagePreview("");
      status.textContent = mode === "edit" ? "Producto actualizado." : "Producto enviado.";
      onSaved();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  return {
    element: form,
    setCategories(nextCategories) {
      categories = nextCategories.filter((category) => category.activo !== "NO");
      renderCategories(categorySelect.value);
    },
    setBrands(nextBrands) {
      brands = nextBrands.filter((brand) => brand.activo !== "NO");
      renderBrands(brandSelect.value);
    },
    setProduct(product) {
      mode = product ? "edit" : "create";
      form.reset();
      form.id.value = product?.id || "";
      form.nombre.value = product?.nombre || "";
      renderCategories(product?.categoria || "");
      renderBrands(product?.marca || "");
      form.precio.value = product?.precio || "";
      form.stock.value = product?.stock || "";
      form.imagen_url.value = product?.imagen_url || "";
      form.imagen_2_url.value = product?.imagen_2_url || "";
      form.imagen_3_url.value = product?.imagen_3_url || "";
      form.imagen_4_url.value = product?.imagen_4_url || "";
      form.imagen_5_url.value = product?.imagen_5_url || "";
      setImagePreview(product?.imagen_url || "");
      form.descripcion.value = product?.descripcion || "";
      form.activo.checked = product ? product.activo !== "NO" : true;
      status.textContent = "";
    },
  };
}
