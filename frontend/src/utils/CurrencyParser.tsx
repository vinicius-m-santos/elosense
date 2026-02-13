import NumberRounder from "./NumberRounder";

export default function CurrencyParser(amount: number): string {
  let roundedNumber = NumberRounder(amount, 2);
  roundedNumber = parseFloat(roundedNumber.toString());

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(roundedNumber);
}
