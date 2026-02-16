"use client";

import { useState, useEffect } from "react";
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
    trigger,
    formState: { errors, isValid },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const newPassword = watch("newPassword", "");
  const confirmPassword = watch("confirmPassword", "");
  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  useEffect(() => {
    if (confirmPassword) {
      trigger("confirmPassword");
    }
  }, [newPassword, confirmPassword, trigger]);

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
      <DialogContent className="rounded-xl w-[90vw] max-w-[400px] sm:max-w-[500px] max-h-[85vh] overflow-y-auto border-zinc-200/80 bg-white dark:border-purple-500/20 dark:bg-zinc-900/95 dark:backdrop-blur-xl text-zinc-900 dark:text-zinc-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">Alterar senha</DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400">
            Digite sua senha atual e escolha uma nova senha segura.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-zinc-700 dark:text-zinc-300">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...register("currentPassword")}
                  className="pr-10 bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
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
                <p className="text-xs text-red-400">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-zinc-700 dark:text-zinc-300">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  className="pr-10 bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
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
                <p className="text-xs text-red-400">
                  {errors.newPassword.message}
                </p>
              )}
              {passwordStrength && newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1.5">
                    <div
                      className={`flex-1 rounded ${
                        passwordStrength.strength === "weak"
                          ? "bg-red-500"
                          : passwordStrength.strength === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded ${
                        passwordStrength.strength === "strong"
                          ? "bg-emerald-500"
                          : passwordStrength.strength === "medium"
                            ? "bg-amber-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded ${
                        passwordStrength.strength === "strong"
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Força:{" "}
                    <span
                      className={
                        passwordStrength.strength === "weak"
                          ? "text-red-500 dark:text-red-400"
                          : passwordStrength.strength === "medium"
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-emerald-500 dark:text-emerald-400"
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
                    <ul className="text-xs text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="pr-10 bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
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
                <p className="text-xs text-red-400">
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
              styling="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
