// Shared formatting helpers for the ShafaQ Atelier store.

export function formatPKR(value: number): string {
  return "PKR " + value.toLocaleString("en-PK");
}

export function formatPKRShort(value: number): string {
  if (value >= 1000) {
    return "PKR " + (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + "k";
  }
  return "PKR " + value.toLocaleString("en-PK");
}
