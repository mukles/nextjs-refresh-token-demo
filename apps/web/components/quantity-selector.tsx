import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  value,
  onChange,
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-stone-200"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="grid size-10 place-items-center rounded-l-lg text-stone-600 hover:bg-stone-100 disabled:opacity-35"
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </button>
      <span
        className="min-w-10 text-center text-sm font-semibold"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid size-10 place-items-center rounded-r-lg text-stone-600 hover:bg-stone-100"
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
