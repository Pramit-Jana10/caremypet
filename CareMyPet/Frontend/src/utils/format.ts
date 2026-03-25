export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(amount);
}

export function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

