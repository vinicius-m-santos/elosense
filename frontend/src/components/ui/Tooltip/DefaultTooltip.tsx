import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DefaultTooltip({ children, tooltipText, delay = 700 }) {
    return (
        <TooltipProvider delayDuration={delay}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>

                <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
