const SHEET_NAME = "productos";
const CATEGORY_SHEET_NAME = "categorias";
const BRAND_SHEET_NAME = "marcas";

function doGet(e) {
  const action = e.parameter.action || "list";

  if (action === "list") {
    const includeInactive = e.parameter.includeInactive === "1";
    const sheet = getProductSheet();
    return jsonResponse({
      ok: true,
      products: getProducts(sheet, includeInactive),
    });
  }

  if (action === "list_categories") {
    const includeInactive = e.parameter.includeInactive === "1";
    const sheet = getCategorySheet();
    return jsonResponse({
      ok: true,
      categories: getCategories(sheet, includeInactive),
    });
  }

  if (action === "list_brands") {
    const includeInactive = e.parameter.includeInactive === "1";
    const sheet = getBrandSheet();
    return jsonResponse({
      ok: true,
      brands: getBrands(sheet, includeInactive),
    });
  }

  return jsonResponse({ ok: false, message: "Accion no soportada" });
}

function doPost(e) {
  const expectedToken = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN");
  const token = e.parameter.token;

  if (!expectedToken || token !== expectedToken) {
    return jsonResponse({ ok: false, message: "Token invalido" });
  }

  const sheet = getProductSheet();
  const action = e.parameter.action || "create";

  if (action === "adjust_stock") {
    return adjustStock(sheet, e.parameter.id, Number(e.parameter.delta || 0));
  }

  if (action === "set_active") {
    return setActive(sheet, e.parameter.id, e.parameter.activo || "SI");
  }

  if (action === "update_product") {
    return updateProduct(sheet, e.parameter);
  }

  if (action === "create_category") {
    return createCategory(getCategorySheet(), e.parameter);
  }

  if (action === "update_category") {
    return updateCategory(getCategorySheet(), e.parameter);
  }

  if (action === "set_category_active") {
    return setCategoryActive(getCategorySheet(), e.parameter.id, e.parameter.activo || "SI");
  }

  if (action === "create_brand") {
    return createBrand(getBrandSheet(), e.parameter);
  }

  if (action === "update_brand") {
    return updateBrand(getBrandSheet(), e.parameter);
  }

  if (action === "set_brand_active") {
    return setBrandActive(getBrandSheet(), e.parameter.id, e.parameter.activo || "SI");
  }

  const id = Utilities.getUuid();
  const now = new Date();
  const headers = getHeaders(sheet);
  const row = headers.map(function(header) {
    if (header === "id") return id;
    if (header === "creado_en") return now;
    if (header === "activo") return e.parameter.activo || "SI";
    return e.parameter[header] || "";
  });

  sheet.appendRow(row);

  return jsonResponse({ ok: true, id: id });
}

function getProducts(sheet, includeInactive) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1)
    .map(function(row) {
      return headers.reduce(function(product, header, index) {
        product[header] = row[index];
        return product;
      }, {});
    })
    .filter(function(product) {
      return includeInactive || String(product.activo || "SI") !== "NO";
    });
}

function getCategories(sheet, includeInactive) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1)
    .map(function(row) {
      return headers.reduce(function(category, header, index) {
        category[header] = row[index];
        return category;
      }, {});
    })
    .filter(function(category) {
      return includeInactive || String(category.activo || "SI") !== "NO";
    });
}

function getBrands(sheet, includeInactive) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1)
    .map(function(row) {
      return headers.reduce(function(brand, header, index) {
        brand[header] = row[index];
        return brand;
      }, {});
    })
    .filter(function(brand) {
      return includeInactive || String(brand.activo || "SI") !== "NO";
    });
}

function adjustStock(sheet, id, delta) {
  const rowIndex = findRowById(sheet, id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Producto no encontrado" });
  }

  const headers = getHeaders(sheet);
  const stockColumn = headers.indexOf("stock") + 1;
  const currentStock = Number(sheet.getRange(rowIndex, stockColumn).getValue() || 0);
  const nextStock = Math.max(0, currentStock + delta);

  sheet.getRange(rowIndex, stockColumn).setValue(nextStock);
  return jsonResponse({ ok: true, stock: nextStock });
}

function setActive(sheet, id, activeValue) {
  const rowIndex = findRowById(sheet, id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Producto no encontrado" });
  }

  const headers = getHeaders(sheet);
  const activeColumn = headers.indexOf("activo") + 1;
  sheet.getRange(rowIndex, activeColumn).setValue(activeValue);

  return jsonResponse({ ok: true, activo: activeValue });
}

function updateProduct(sheet, params) {
  const rowIndex = findRowById(sheet, params.id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Producto no encontrado" });
  }

  const headers = getHeaders(sheet);
  const editableFields = [
    "nombre",
    "categoria",
    "marca",
    "precio",
    "stock",
    "descripcion",
    "imagen_url",
    "imagen_2_url",
    "imagen_3_url",
    "imagen_4_url",
    "imagen_5_url",
    "activo",
  ];

  editableFields.forEach(function(field) {
    const column = headers.indexOf(field) + 1;
    if (column > 0) {
      sheet.getRange(rowIndex, column).setValue(params[field] || "");
    }
  });

  return jsonResponse({ ok: true, id: params.id });
}

function createCategory(sheet, params) {
  const id = Utilities.getUuid();
  const now = new Date();

  sheet.appendRow([
    id,
    params.nombre || "",
    params.activo || "SI",
    now,
  ]);

  return jsonResponse({ ok: true, id: id });
}

function updateCategory(sheet, params) {
  const rowIndex = findRowById(sheet, params.id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Categoria no encontrada" });
  }

  const headers = getHeaders(sheet);
  const nameColumn = headers.indexOf("nombre") + 1;
  const activeColumn = headers.indexOf("activo") + 1;

  sheet.getRange(rowIndex, nameColumn).setValue(params.nombre || "");
  sheet.getRange(rowIndex, activeColumn).setValue(params.activo || "SI");

  return jsonResponse({ ok: true, id: params.id });
}

function setCategoryActive(sheet, id, activeValue) {
  const rowIndex = findRowById(sheet, id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Categoria no encontrada" });
  }

  const headers = getHeaders(sheet);
  const activeColumn = headers.indexOf("activo") + 1;
  sheet.getRange(rowIndex, activeColumn).setValue(activeValue);

  return jsonResponse({ ok: true, activo: activeValue });
}

function createBrand(sheet, params) {
  const id = Utilities.getUuid();
  const now = new Date();

  sheet.appendRow([
    id,
    params.nombre || "",
    params.activo || "SI",
    now,
  ]);

  return jsonResponse({ ok: true, id: id });
}

function updateBrand(sheet, params) {
  const rowIndex = findRowById(sheet, params.id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Marca no encontrada" });
  }

  const headers = getHeaders(sheet);
  const nameColumn = headers.indexOf("nombre") + 1;
  const activeColumn = headers.indexOf("activo") + 1;

  sheet.getRange(rowIndex, nameColumn).setValue(params.nombre || "");
  sheet.getRange(rowIndex, activeColumn).setValue(params.activo || "SI");

  return jsonResponse({ ok: true, id: params.id });
}

function setBrandActive(sheet, id, activeValue) {
  const rowIndex = findRowById(sheet, id);
  if (!rowIndex) {
    return jsonResponse({ ok: false, message: "Marca no encontrada" });
  }

  const headers = getHeaders(sheet);
  const activeColumn = headers.indexOf("activo") + 1;
  sheet.getRange(rowIndex, activeColumn).setValue(activeValue);

  return jsonResponse({ ok: true, activo: activeValue });
}

function getProductSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  ensureProductHeaders(sheet);
  return sheet;
}

function ensureProductHeaders(sheet) {
  [
    "id",
    "nombre",
    "categoria",
    "marca",
    "precio",
    "stock",
    "descripcion",
    "imagen_url",
    "imagen_2_url",
    "imagen_3_url",
    "imagen_4_url",
    "imagen_5_url",
    "activo",
    "creado_en",
  ].forEach(function(header) {
    appendMissingHeader(sheet, header);
  });
}

function appendMissingHeader(sheet, header) {
  const headers = getHeaders(sheet);
  if (headers.indexOf(header) >= 0) {
    return;
  }

  const nextColumn = sheet.getLastColumn() + 1;
  sheet.getRange(1, nextColumn).setValue(header);
}

function getCategorySheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CATEGORY_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CATEGORY_SHEET_NAME);
    sheet.appendRow(["id", "nombre", "activo", "creado_en"]);
    seedCategoriesFromProducts(sheet);
  } else if (sheet.getLastRow() <= 1) {
    seedCategoriesFromProducts(sheet);
  }

  return sheet;
}

function getBrandSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(BRAND_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(BRAND_SHEET_NAME);
    sheet.appendRow(["id", "nombre", "activo", "creado_en"]);
    seedBrandsFromProducts(sheet);
  } else if (sheet.getLastRow() <= 1) {
    seedBrandsFromProducts(sheet);
  }

  return sheet;
}

function seedCategoriesFromProducts(categorySheet) {
  const productSheet = getProductSheet();
  if (!productSheet || productSheet.getLastRow() <= 1) {
    return;
  }

  const values = productSheet.getDataRange().getValues();
  const headers = values[0];
  const categoryColumn = headers.indexOf("categoria");
  const now = new Date();
  const names = {};

  if (categoryColumn < 0) {
    return;
  }

  values.slice(1).forEach(function(row) {
    const name = String(row[categoryColumn] || "").trim();
    if (name) {
      names[name] = true;
    }
  });

  Object.keys(names).forEach(function(name) {
    categorySheet.appendRow([Utilities.getUuid(), name, "SI", now]);
  });
}

function seedBrandsFromProducts(brandSheet) {
  const productSheet = getProductSheet();
  if (!productSheet || productSheet.getLastRow() <= 1) {
    return;
  }

  const values = productSheet.getDataRange().getValues();
  const headers = values[0];
  const brandColumn = headers.indexOf("marca");
  const now = new Date();
  const names = {};

  if (brandColumn < 0) {
    return;
  }

  values.slice(1).forEach(function(row) {
    const name = String(row[brandColumn] || "").trim();
    if (name) {
      names[name] = true;
    }
  });

  Object.keys(names).forEach(function(name) {
    brandSheet.appendRow([Utilities.getUuid(), name, "SI", now]);
  });
}

function findRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColumn = headers.indexOf("id");

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) === String(id)) {
      return index + 1;
    }
  }

  return null;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.clear();
  sheet.appendRow([
    "id",
    "nombre",
    "categoria",
    "marca",
    "precio",
    "stock",
    "descripcion",
    "imagen_url",
    "imagen_2_url",
    "imagen_3_url",
    "imagen_4_url",
    "imagen_5_url",
    "activo",
    "creado_en",
  ]);
}
