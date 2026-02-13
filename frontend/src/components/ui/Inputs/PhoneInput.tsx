import { IMaskInput } from "react-imask";

interface Phone {
    type?: string;
    value: string;
    maxLength?: number;
    onChange: (label: string, value: string | number) => void;
    onBlur?: (e) => void;
    required?: boolean;
    customClass?: string;
    label: string;
}

export default function PhoneInput({
    type = "text",
    value,
    maxLength = 20,
    onChange,
    onBlur,
    required = true,
    customClass = "",
    label,
}: Phone) {
    return (
        <IMaskInput
            type={type}
            value={value}
            maxLength={maxLength}
            onAccept={(val) => onChange(label, val)}
            onBlur={onBlur}
            mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
            placeholder="Whatsapp"
            required={required}
            className={`
                flex h-9 w-full rounded-md border border-input bg-transparent 
                px-3 py-1 text-base shadow-sm transition-colors file:border-0 
                file:bg-transparent file:text-sm file:font-medium file:text-foreground 
                placeholder:text-muted-foreground focus-visible:outline-none 
                focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed 
                disabled:opacity-50 md:text-sm col-span-3 ${customClass}`}
        />
    );
}
