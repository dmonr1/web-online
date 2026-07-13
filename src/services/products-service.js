import { storeConfig } from "../config.js";
import { sampleProducts } from "../data/sample-products.js";

export function formatMoney(value) {
  return `${storeConfig.currency} ${Number(value || 0).toFixed(2)}`;
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines.shift()).map((header) => header.trim());

  return lines.map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = (values[index] || "").replace(/^"|"$/g, "").trim();
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

export async function getProducts({ includeInactive = false } = {}) {
  if (!storeConfig.sheetCsvUrl) {
    console.warn("[productos] sheetCsvUrl vacio. Usando productos demo.", {
      demoCount: sampleProducts.length,
    });
    return includeInactive ? sampleProducts : sampleProducts.filter((product) => product.activo !== "NO");
  }

  if (storeConfig.sheetCsvUrl.includes("pubhtml")) {
    console.warn("[productos] La URL configurada parece HTML, no CSV. Publica la hoja como .csv.", {
      sheetCsvUrl: storeConfig.sheetCsvUrl,
    });
  }

  console.log("[productos] Leyendo productos desde Google Sheets CSV...", {
    sheetCsvUrl: storeConfig.sheetCsvUrl,
    includeInactive,
  });

  try {
    const response = await fetch(storeConfig.sheetCsvUrl);
    const text = await response.text();
    const products = parseCsv(text);
    const visibleProducts = includeInactive ? products : products.filter((product) => product.activo !== "NO");

    console.log("[productos] Productos cargados desde CSV.", {
      totalCsv: products.length,
      totalDevueltos: visibleProducts.length,
      primerosProductos: visibleProducts.slice(0, 3),
    });

    return visibleProducts;
  } catch (error) {
    console.warn("[productos] Fallo CSV. Intentando leer desde Apps Script.", error);
    return getProductsFromAppsScript({ includeInactive });
  }
}

async function getProductsFromAppsScript({ includeInactive }) {
  if (!storeConfig.appsScriptUrl) {
    throw new Error("No hay appsScriptUrl configurado para leer productos.");
  }

  const url = new URL(storeConfig.appsScriptUrl);
  url.searchParams.set("action", "list");
  url.searchParams.set("includeInactive", includeInactive ? "1" : "0");

  console.log("[productos] Leyendo productos desde Apps Script...", {
    appsScriptUrl: url.toString(),
  });

  const response = await fetch(url.toString());
  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(payload.message || "Apps Script no pudo devolver productos.");
  }

  console.log("[productos] Productos cargados desde Apps Script.", {
    totalDevueltos: payload.products.length,
    primerosProductos: payload.products.slice(0, 3),
  });

  return payload.products;
}

export async function sendAdminAction(payload) {
  if (!storeConfig.appsScriptUrl) {
    throw new Error("Configura appsScriptUrl en src/config.js.");
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => formData.set(key, value));

  await fetch(storeConfig.appsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  });
}

export async function getCategories({ includeInactive = false } = {}) {
  if (!storeConfig.appsScriptUrl) {
    return [];
  }

  const url = new URL(storeConfig.appsScriptUrl);
  url.searchParams.set("action", "list_categories");
  url.searchParams.set("includeInactive", includeInactive ? "1" : "0");

  const response = await fetch(url.toString());
  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(payload.message || "Apps Script no pudo devolver categorias.");
  }

  return payload.categories;
}

export async function getBrands({ includeInactive = false } = {}) {
  if (!storeConfig.appsScriptUrl) {
    return [];
  }

  const url = new URL(storeConfig.appsScriptUrl);
  url.searchParams.set("action", "list_brands");
  url.searchParams.set("includeInactive", includeInactive ? "1" : "0");

  const response = await fetch(url.toString());
  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(payload.message || "Apps Script no pudo devolver marcas.");
  }

  return payload.brands;
}
