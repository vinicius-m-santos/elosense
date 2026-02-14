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

/**
 * Formata timestamp de partida (ms) para exibição: "X min atrás", "X h atrás", "Ontem" ou "dd/MM".
 * Usa o fuso local do usuário.
 */
export function formatMatchDate(ts: number | null | undefined): string {
  if (ts == null || ts <= 0) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor((todayStart.getTime() - matchDayStart.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin} min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} h atrás`;
    return "Hoje";
  }
  if (diffDays === 1) return "Ontem";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}
