import { Button } from "@/components/ui/button";

export default function BaseButton({
  onClick = () => {},
  styling = "",
  variant = "default",
  disabled = false,
  children,
  size = "default",
  type = "button",
}) {
  return (
    <Button
      disabled={disabled}
      className={styling}
      onClick={onClick}
      variant={variant}
      type={type}
      size={size}
    >
      {children}
    </Button>
  );
}
