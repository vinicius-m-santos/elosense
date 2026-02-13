import BaseButton from "@/components/ui/Buttons/BaseButton";

export default function DefaultButton({
    children,
    text = "Novo",
    onClick = () => {},
    styling = "cursor-pointer text-white font-semibold rounded-lg py-2 transition-colors disabled:opacity-100 flex items-center gap-2",
    icon = null,
    size = "default",
}) {
    return (
        <BaseButton styling={styling} onClick={onClick} size={size}>
            {children ? (
                children
            ) : (
                <>
                    {icon && <span className="flex items-center">{icon}</span>}
                    <span>{text}</span>
                </>
            )}
        </BaseButton>
    );
}
