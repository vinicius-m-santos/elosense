import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { OBJECTIVES } from "@/utils/constants/Client/constants";

const selectContentClass = (dark: boolean) =>
    dark ? "bg-zinc-900 border-white/10 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900";

export default function ObjectiveSelect({ value, handleChange, dark = false }) {
    return (
        <>
            <Label
                htmlFor="objetivo"
                className="text-right text-sm font-medium"
            >
                Objetivo
            </Label>
            <div className="col-span-3">
                <Select
                    value={value}
                    onValueChange={(value) => handleChange("objective", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass(dark)}>
                        {Object.entries(OBJECTIVES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}
