"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Lock,
    Shield,
    Monitor,
    Smartphone,
    LogOut,
    Trash2,
} from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";

export default function SecuritySection() {
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Lock className="text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Senha</h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Altere sua senha regularmente para manter sua conta segura.
                    </p>

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setIsChangePasswordOpen(true)}
                    >
                        Alterar senha
                    </Button>
                </CardContent>
            </Card>

            <ChangePasswordModal
                open={isChangePasswordOpen}
                onOpenChange={setIsChangePasswordOpen}
            />

            {/* <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Shield className="text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Sessões ativas</h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Veja onde sua conta está logada no momento.
                    </p>

                    <Separator />

                    <div className="space-y-3 text-sm">
                        <SessionItem
                            icon={<Monitor size={16} />}
                            label="Windows • Chrome"
                            meta="Ativo agora"
                        />

                        <SessionItem
                            icon={<Smartphone size={16} />}
                            label="Android • App Mobile"
                            meta="Último acesso há 2 dias"
                        />
                    </div>

                    <Button variant="outline" className="w-full sm:w-auto">
                        Encerrar todas as sessões
                    </Button>
                </CardContent>
            </Card> */}

            {/* <Card className="border-destructive/30">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-destructive">
                        <Trash2 />
                        <h3 className="text-lg font-semibold">Zona de risco</h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Essas ações são irreversíveis. Tenha certeza antes de continuar.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="gap-2">
                            <LogOut size={16} />
                            Sair de todos os dispositivos
                        </Button>

                        <Button
                            variant="destructive"
                            className="text-white flex items-center gap-1 cursor-pointer"
                            onClick={() => setIsDeleteAccountOpen(true)}
                        >
                            <Trash2 size={16} />
                            Excluir conta
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <DeleteAccountModal
                open={isDeleteAccountOpen}
                onOpenChange={setIsDeleteAccountOpen}
            /> */}
        </div>
    );
}

// function SessionItem({
//     icon,
//     label,
//     meta,
// }: {
//     icon: React.ReactNode;
//     label: string;
//     meta: string;
// }) {
//     return (
//         <div className="flex items-center justify-between gap-4">
//             <div className="flex items-center gap-3">
//                 <div className="text-muted-foreground">{icon}</div>
//                 <span>{label}</span>
//             </div>
//             <span className="text-muted-foreground text-xs">{meta}</span>
//         </div>
//     );
// }
