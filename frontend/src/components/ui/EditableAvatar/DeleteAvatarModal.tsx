import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import DangerButton from "@/components/ui/Buttons/components/DangerButton";
import OutlineButton from "@/components/ui/Buttons/components/OutlineButton";
import { Trash2 } from "lucide-react";

type DeleteAvatarModalProps = {
  onConfirm: () => void;
  title?: string;
  children?: React.ReactNode;
};

export default function DeleteAvatarModal({
  onConfirm,
  title = "Remover foto do perfil?",
  children,
}: DeleteAvatarModalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button
            size="icon"
            className="
              absolute bottom-0 right-0 z-10 w-8 h-8 rounded-full
              bg-red-600 hover:bg-red-500
              text-white shadow-md
              transition-all duration-200
              hover:scale-105
            "
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent
        className="
          w-[92vw] max-w-md
          rounded-2xl border
          
          bg-white border-zinc-200 text-zinc-900
          dark:bg-zinc-900/95 dark:border-white/10 dark:text-zinc-100
          
          backdrop-blur-xl
          shadow-2xl
        "
      >
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="
                flex items-center justify-center
                w-10 h-10 rounded-xl
                bg-red-100 text-red-600
                dark:bg-red-500/15 dark:text-red-400
              "
            >
              <Trash2 className="w-5 h-5" />
            </div>

            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription
            className="
              text-sm leading-relaxed
              text-zinc-600
              dark:text-zinc-400
            "
          >
            Essa ação removerá sua foto atual permanentemente.
            Você poderá enviar uma nova imagem depois, se desejar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 gap-2 sm:gap-3">
          <AlertDialogCancel asChild>
            <OutlineButton>
              Cancelar
            </OutlineButton>
          </AlertDialogCancel>

          <AlertDialogAction onClick={onConfirm} asChild>
            <DangerButton>
              Remover foto
            </DangerButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
