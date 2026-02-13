"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SaveButton from "@/components/ui/Buttons/components/SaveButton";
import OutlineButton from "@/components/ui/Buttons/components/OutlineButton";
import { useRequest } from "@/api/request";
import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[a-z]/, "A senha deve conter letras minúsculas")
      .regex(/[A-Z]/, "A senha deve conter letras maiúsculas")
      .regex(/[0-9]/, "A senha deve conter números"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

type ChangePasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Pelo menos 8 caracteres");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Letras minúsculas");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Letras maiúsculas");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Números");

  if (password.length >= 12) score += 1;

  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 4) strength = "strong";
  else if (score >= 3) strength = "medium";

  return { strength, score, feedback };
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const request = useRequest();
  const { user, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const newPassword = watch("newPassword", "");
  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const onSubmit = async (data: PasswordFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await request({
        method: "post",
        url: `/user/${user.id}/change-password`,
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        showSuccess: true,
        successMessage: "Senha alterada com sucesso",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by useRequest
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-md w-[90vw] max-w-[400px] sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Digite sua senha atual e escolha uma nova senha segura.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...register("currentPassword")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
              {passwordStrength && newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1.5">
                    <div
                      className={`flex-1 rounded ${
                        passwordStrength.strength === "weak"
                          ? "bg-destructive"
                          : passwordStrength.strength === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded ${
                        passwordStrength.strength === "strong"
                          ? "bg-green-500"
                          : passwordStrength.strength === "medium"
                          ? "bg-yellow-500"
                          : "bg-muted"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded ${
                        passwordStrength.strength === "strong"
                          ? "bg-green-500"
                          : "bg-muted"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Força:{" "}
                    <span
                      className={
                        passwordStrength.strength === "weak"
                          ? "text-destructive"
                          : passwordStrength.strength === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {passwordStrength.strength === "weak"
                        ? "Fraca"
                        : passwordStrength.strength === "medium"
                        ? "Média"
                        : "Forte"}
                    </span>
                  </p>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <OutlineButton type="button" onClick={() => onOpenChange(false)} />
            <SaveButton
              type="submit"
              loading={isLoading}
              disabled={!isValid || isLoading}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
