import { storeConfig } from "../config.js";
import { formatMoney } from "./products-service.js";

export function buildWhatsappUrl(items) {
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(buildWhatsappMessage(items))}`;
}

function buildWhatsappMessage(items) {
  if (!items.length) {
    return "Hola, quiero consultar sobre sus productos.";
  }

  const lines = items.map((item) => {
    const subtotal = Number(item.precio || 0) * Number(item.qty || 1);
    return `- ${item.qty}x ${item.nombre} - ${formatMoney(subtotal)}`;
  });
  const total = items.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.qty || 1), 0);

  return `Hola, quiero comprar estos productos:\n\n${lines.join("\n")}\n\nTotal: ${formatMoney(total)}\n\n¿Esta disponible?`;
}
