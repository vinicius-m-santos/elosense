"use client";

import { IMaskInput } from "react-imask";
import { cn } from "@/lib/utils";

export interface BirthDateInputProps {
  value: string;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Calcula idade a partir de data no formato dd/mm/yyyy
 */
export function birthDateToAge(value: string | null): number | null {
  const iso = birthDateToISO(value);
  if (!iso) return null;
  const birth = new Date(iso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Converte idade para data aproximada (01/01/(ano atual - idade))
 */
export function ageToBirthDate(age: number | null | undefined): string {
  if (!age || age < 0 || age > 150) return "";
  const year = new Date().getFullYear() - age;
  return `01/01/${year}`;
}

/**
 * Converte data no formato dd/mm/yyyy para yyyy-mm-dd (ISO)
 */
export function birthDateToISO(value: string | null): string | null {
  if (!value || value.trim().length < 10) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

/**
 * Converte data no formato yyyy-mm-dd (ISO) para dd/mm/yyyy
 */
export function isoToBirthDate(value: string | null | undefined): string {
  if (!value || value.trim().length < 10) return "";
  const parts = value.split("T")[0].split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export default function BirthDateInput({
  value,
  onChange,
  onBlur,
  placeholder = "dd/mm/aaaa",
  className,
  id,
  disabled = false,
}: BirthDateInputProps) {
  return (
    <IMaskInput
      mask="00/00/0000"
      value={value}
      onAccept={(val: string) => onChange(val?.trim() || null)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
    />
  );
}
