"use client";

import { IMaskInput } from "react-imask";
import { cn } from "@/lib/utils";
import { birthDateToISO, isoToBirthDate } from "@/components/Inputs/BirthDateInput";
import { ISO_DATE_REGEX } from "@/utils/dateUtils";

export interface DueDateInputProps {
  value: string;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export default function DueDateInput({
  value,
  onChange,
  onBlur,
  placeholder = "dd/mm/aaaa",
  className,
  id,
  disabled = false,
}: DueDateInputProps) {
  const displayValue =
    value && ISO_DATE_REGEX.test(value.trim()) ? isoToBirthDate(value) : value ?? "";

  return (
    <IMaskInput
      mask="00/00/0000"
      value={displayValue}
      onAccept={(val: string) => {
        const trimmed = val?.trim() || "";
        const iso = birthDateToISO(trimmed || null);
        onChange(iso ?? (trimmed === "" ? null : trimmed));
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      inputMode="numeric"
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
    />
  );
}
