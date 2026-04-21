const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("ru-RU");

export function formatCurrency(value) {
  return `${currencyFormatter.format(Number(value || 0))} ₽`;
}

export function formatInteger(value) {
  return integerFormatter.format(Number(value || 0));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
