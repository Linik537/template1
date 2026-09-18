type NumberInputProps = {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  upStart?: number;
  downStart?: number;
  ariaLabel?: string;
};

export function NumberInput({
  value,
  onChange,
  className = "",
  placeholder,
  min,
  max,
  step = 1,
  upStart,
  downStart,
  ariaLabel,
}: NumberInputProps) {
  function changeBy(direction: 1 | -1) {
    const current = value === "" ? undefined : Number(value);
    const starting = direction === 1 ? upStart : downStart;
    const next = current === undefined ? (starting ?? 0) : current + direction * step;
    const bounded = Math.min(
      max ?? Number.POSITIVE_INFINITY,
      Math.max(min ?? Number.NEGATIVE_INFINITY, next),
    );
    onChange(String(bounded));
  }

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className={`number-input w-full pr-11 ${className}`}
      />
      <div className="absolute right-0 top-1/2 flex h-14 w-10 -translate-y-1/2 flex-col items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Aumentar valor"
          onClick={() => changeBy(1)}
          className="number-stepper flex h-5 w-10 items-center justify-center rounded-md transition hover:bg-white/10"
        >
          <span aria-hidden className="number-chevron number-chevron-up" />
        </button>
        <button
          type="button"
          aria-label="Diminuir valor"
          onClick={() => changeBy(-1)}
          className="number-stepper flex h-5 w-10 items-center justify-center rounded-md transition hover:bg-white/10"
        >
          <span aria-hidden className="number-chevron number-chevron-down" />
        </button>
      </div>
    </div>
  );
}
