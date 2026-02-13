"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useRequest } from "@/api/request";
import { useAuth } from "@/providers/AuthProvider";

export default function DeleteAccountModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [confirmation, setConfirmation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const request = useRequest();
    const { user, logout } = useAuth();

    const canDelete = confirmation === "EXCLUIR";

    const handleDelete = async () => {
        if (!user || !canDelete) return;

        setIsLoading(true);
        try {
            await request({
                method: "delete",
                url: `/user/${user.id}`,
                showSuccess: true,
                successMessage: "Conta excluída com sucesso",
            });
            onOpenChange(false);
            setTimeout(() => logout(), 500);
        } catch (error) {
            // Error is handled by useRequest
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-md w-[90vw] max-w-[400px] sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        <AlertDialogTitle className="text-lg sm:text-xl">
                            Excluir conta
                        </AlertDialogTitle>
                    </div>

                    <AlertDialogDescription className="space-y-2 pt-2 text-sm sm:text-base">
                        <div>
                            <p>
                                Essa ação é permanente e não pode ser desfeita.
                            </p>
                            <p>
                                Todos os seus dados, histórico e informações associadas
                                à sua conta serão removidos.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2">
                    <p className="text-sm text-muted-foreground">
                        Para confirmar, digite <strong className="text-foreground">EXCLUIR</strong> abaixo:
                    </p>

                    <Input
                        placeholder="Digite EXCLUIR"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        className="w-full"
                        disabled={isLoading}
                    />
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
                    <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto">
                        Cancelar
                    </AlertDialogCancel>

                    <Button
                        variant="destructive"
                        disabled={!canDelete || isLoading}
                        onClick={handleDelete}
                        className="w-full sm:w-auto text-white flex items-center justify-center gap-1"
                    >
                        <Trash2 size={16} />
                        {isLoading ? "Excluindo..." : "Excluir conta permanentemente"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
