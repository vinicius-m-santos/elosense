import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function GenderSelect({ value, handleChange }) {
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
                    <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}
