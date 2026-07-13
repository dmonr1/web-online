const CART_KEY = "ventas_cart";

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(cart, product) {
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.qty += 1;
    existing.imagen_url = product.imagen_url || existing.imagen_url || "";
    return cart;
  }

  cart.push({
    id: product.id,
    nombre: product.nombre,
    precio: Number(product.precio || 0),
    imagen_url: product.imagen_url || "",
    qty: 1,
  });

  return cart;
}

export function updateQuantity(cart, id, amount) {
  const item = cart.find((cartItem) => cartItem.id === id);
  if (!item) return cart;

  item.qty += amount;
  return cart.filter((cartItem) => cartItem.qty > 0);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.qty || 1), 0);
}
