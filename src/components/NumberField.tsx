import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './NumberField.css';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  disabled = false,
  min,
  max,
  step,
}: NumberFieldProps) {
  const [input, setInput] = useState({ value, draft: String(value) });

  // При изменении значения извне обновляем поле без дополнительного эффекта.
  if (input.value !== value) {
    setInput({ value, draft: String(value) });
  }

  function isValidNumber(text: string): boolean {
    const number = Number(text);

    return (
      text.trim() !== '' &&
      Number.isFinite(number) &&
      (min === undefined || number >= min) &&
      (max === undefined || number <= max)
    );
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const draft = event.target.value;
    setInput({ value, draft });

    if (isValidNumber(draft)) {
      onChange(Number(draft));
    }
  }

  function handleBlur(): void {
    if (!isValidNumber(input.draft)) {
      setInput({ value, draft: String(value) });
    }
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={input.draft}
        min={min}
        max={max}
        step={step ?? 'any'}
        disabled={disabled}
        aria-invalid={!isValidNumber(input.draft)}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </label>
  );
}
