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
            variant="destructive"
            className="absolute cursor-pointer w-8 h-8 text-white rounded-full bottom-0 right-0 opacity-80 hover:opacity-100 transition-opacity z-10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-md w-[90vw] max-w-[400px] sm:max-w-[500px] md:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação removerá a foto atual permanentemente. Você poderá enviar
            uma nova imagem depois, se desejar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <OutlineButton />
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} asChild>
            <DangerButton />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
