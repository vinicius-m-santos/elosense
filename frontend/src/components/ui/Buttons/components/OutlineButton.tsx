import BaseButton from "@/components/ui/Buttons/BaseButton";

export default function OutlineButton({
    text = "Cancelar",
    onClick = () => {},
    styling = "flex cursor-pointer items-center gap-2",
    variant = "outline",
}) {
    return (
        <BaseButton styling={`${styling}`} onClick={onClick} variant={variant}>
            {text}
        </BaseButton>
    );
}
