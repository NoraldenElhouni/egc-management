export function formatCurrency(amount: number, currency = "USD"): string {
  const curr = currency.toUpperCase();

  // Choose locale and fraction digits based on currency
  let locale = "en-US";
  let minimumFractionDigits = 2;
  let maximumFractionDigits = 2;

  switch (curr) {
    case "LYD":
      locale = "en-LY"; // Libyan Arabic locale
      // Libyan dinar commonly uses 3 decimal places
      minimumFractionDigits = 3;
      maximumFractionDigits = 3;
      break;
    case "EUR":
      locale = "de-DE"; // common Euro locale (adjust as needed)
      minimumFractionDigits = 2;
      maximumFractionDigits = 2;
      break;
    case "USD":
    default:
      locale = "en-US";
      minimumFractionDigits = 2;
      maximumFractionDigits = 2;
      break;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: curr,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-LY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
