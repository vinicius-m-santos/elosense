import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { OBJECTIVES } from "@/utils/constants/Client/constants";

export default function ObjectiveSelect({ value, handleChange }) {
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

                    <SelectContent>
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
