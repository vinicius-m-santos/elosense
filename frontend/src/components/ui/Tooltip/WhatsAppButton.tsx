import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SiWhatsapp } from "react-icons/si";

type WhatsappButtonProps = {
  phoneNumber: string | null;
  message: string;
};

export default function WhatsAppButton({
  phoneNumber,
  message,
}: WhatsappButtonProps) {
  const isAvailable = !!phoneNumber;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              relative flex select-none items-center gap-2 rounded-sm 
              px-2 py-1.5 text-sm outline-none transition-colors 
              ${
                !isAvailable
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer opacity-100 hover:bg-gray-100"
              }
            `}
            onClick={() => {
              if (!isAvailable) return;
              window.open(
                `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                  message
                )}`,
                "_blank"
              );
            }}
          >
            <SiWhatsapp className="h-4 w-4 shrink-0" />
            WhatsApp
          </div>
        </TooltipTrigger>

        {!isAvailable && (
          <TooltipContent>Nenhum número de WhatsApp cadastrado</TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
