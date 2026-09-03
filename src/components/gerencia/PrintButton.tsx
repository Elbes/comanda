'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-amber-600 px-6 py-3 text-white font-medium hover:bg-amber-700"
    >
      Imprimir
    </button>
  );
}
