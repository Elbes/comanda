export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
