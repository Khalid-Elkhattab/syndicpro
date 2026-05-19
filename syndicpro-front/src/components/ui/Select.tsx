import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps {
  options: SelectOption[] | SelectGroup[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  grouped?: boolean;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  grouped = false,
  className = '',
  error,
  disabled,
}: SelectProps) {
  if (grouped) {
    const groups = options as SelectGroup[];
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
            error ? 'border-danger' : 'border-surface-300'
          } ${disabled ? 'bg-surface-50 text-text-muted cursor-not-allowed' : 'bg-white text-text-primary'} ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        {error && <p className="text-sm text-danger mt-1">{error}</p>}
      </div>
    );
  }

  const flatOptions = options as SelectOption[];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
          error ? 'border-danger' : 'border-surface-300'
        } ${disabled ? 'bg-surface-50 text-text-muted cursor-not-allowed' : 'bg-white text-text-primary'} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {flatOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      {error && <p className="text-sm text-danger mt-1">{error}</p>}
    </div>
  );
}
