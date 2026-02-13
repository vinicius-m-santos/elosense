import BaseButton from "@/components/ui/Buttons/BaseButton";
import ButtonLoader from "../../buttonLoader";

type Props = {
  text?: string;
  loading?: boolean;
  styling?: string;
  size?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

export default function SaveButton({
  text = "Salvar",
  loading = false,
  styling = "",
  size = "default",
  disabled = false,
  type = "button",
  onClick,
}: Props) {
  return (
    <BaseButton
      disabled={disabled || loading}
      size={size}
      type={type}
      onClick={onClick}
      styling={`flex items-center gap-2 cursor-pointer font-semibold ${styling}`}
    >
      {loading ? <ButtonLoader /> : text}
    </BaseButton>
  );
}
