import { format, parseISO } from "date-fns";

export default function DateConverter(
  createdAt: string,
  dateFormat: string | null
) {
  if (!dateFormat) {
    dateFormat = "dd/MM/yyyy";
  }
  const date = parseISO(createdAt);
  const formatted = format(date, "dd/MM/yyyy HH:mm");

  return formatted;
}
