export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function getTodayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidISODate(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string" || !ISO_DATE_REGEX.test(value.trim())) return false;
  const s = value.trim();
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12) return false;
  const maxDay = getDaysInMonth(y, m);
  if (d < 1 || d > maxDay) return false;
  return true;
}

export function getEffectiveDueDateISO(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const s = value.trim();
  if (ISO_DATE_REGEX.test(s)) return s;
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
  return `${year}-${month}-${day}`;
}

export function isDueDateValid(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  const iso = getEffectiveDueDateISO(value);
  if (!iso) return true;
  if (!isValidISODate(iso)) return false;
  return iso > getTodayYMD();
}

/**
 * Calcula a idade em anos a partir de uma data de nascimento.
 * @param birthDate - Data no formato ISO (yyyy-mm-dd) ou string parseável
 * @returns Idade em anos ou null se a data for inválida
 */
export function calculateAgeFromBirthDate(
  birthDate: string | null | undefined
): number | null {
  if (!birthDate?.trim()) return null;
  const birth = new Date(birthDate.split("T")[0]);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
}
