import BaseButton from "@/components/ui/Buttons/BaseButton";
import ButtonLoader from "../../buttonLoader";

export default function DangerButton({
  text = "Remover",
  onClick = () => { },
  styling = "flex cursor-pointer text-white hover:opacity-80 items-center gap-2",
  loading = false,
  variant = "destructive",
}) {
  return (
    <BaseButton
      disabled={loading}
      styling={`${styling}`}
      onClick={onClick}
      variant={variant}
    >
      {loading && <ButtonLoader />}
      {!loading && text}
    </BaseButton>
  );
}
