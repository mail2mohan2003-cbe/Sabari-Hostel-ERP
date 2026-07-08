"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-maroon text-white px-4 py-2 rounded"
    >
      Print / Save as PDF
    </button>
  );
}
