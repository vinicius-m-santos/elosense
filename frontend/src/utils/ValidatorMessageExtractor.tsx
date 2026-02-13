import { FieldErrors } from "react-hook-form";

export default function getFirstErrorMessage(
  errors: FieldErrors
): string | null {
  if (!errors) return null;

  for (const key of Object.keys(errors)) {
    const error = errors[key];

    if (!error) continue;

    if ("message" in error && error.message) {
      return String(error.message);
    }

    if (typeof error === "object") {
      const nested = getFirstErrorMessage(error as FieldErrors);
      if (nested) return nested;
    }
  }

  return null;
}
