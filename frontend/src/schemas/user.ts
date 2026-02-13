import z from "zod";
import { parse, isValid } from "date-fns";

const birthDateRefine = (val: string | null | undefined) => {
  if (!val?.trim()) return true;
  const parsed = parse(val, "dd/MM/yyyy", new Date());
  if (!isValid(parsed)) return false;
  const today = new Date();
  return parsed <= today && parsed >= new Date("1900-01-01");
};

export const userFormSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val?.trim()) return true;
        const digits = val.replace(/\D/g, "");
        return digits.length === 10 || digits.length === 11;
      },
      { message: "Whatsapp inválido" }
    ),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .refine(birthDateRefine, {
      message: "Data inválida. Use o formato dd/mm/aaaa",
    }),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
