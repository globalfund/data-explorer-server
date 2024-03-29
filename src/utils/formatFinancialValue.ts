export function formatFinancialValue(value: number | bigint): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} USD`;
}
