import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const selectContentClass = (dark: boolean) =>
    dark ? "bg-zinc-900 border-white/10 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900";

export default function GenderSelect({ value, handleChange, dark = false }) {
    return (
        <>
            <Label
                htmlFor="gender"
                className="sm:text-right text-sm font-medium text-black"
            >
                Gênero
            </Label>
            <div className="col-span-3">
                <Select
                    value={value}
                    onValueChange={(value) => handleChange("gender", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass(dark)}>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}
