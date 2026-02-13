export default function NumberRounder(value: number, decimals: number): string {
  const factor = Math.pow(10, decimals);
  const roundedNumber = Math.round(value * factor) / factor;
  return roundedNumber ? roundedNumber.toFixed(decimals) : "0";
}
