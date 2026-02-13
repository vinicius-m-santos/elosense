"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";

import SaveButton from "@/components/ui/Buttons/components/SaveButton";
import OutlineButton from "@/components/ui/Buttons/components/OutlineButton";
import PhoneInput from "@/components/ui/Inputs/PhoneInput";
import BirthDateInput, { birthDateToISO, isoToBirthDate } from "@/components/Inputs/BirthDateInput";

import { userFormSchema, UserFormSchema } from "@/schemas/user";
import EditableAvatar from "@/components/ui/EditableAvatar";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
};

type ProfileUpdateModalProps = {
  userData: User;
  onSubmit: (data: UserFormSchema, setOpen: (v: boolean) => void) => void;
  isLoading: boolean;
};

export default function ProfileUpdateModal({
  userData,
  onSubmit,
  isLoading,
}: ProfileUpdateModalProps) {
  const [open, setOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<UserFormSchema>({
    resolver: zodResolver(userFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: null,
      birthDate: null,
    },
  });

  useEffect(() => {
    if (!userData || !open) return;

    reset({
      firstName: userData.firstName ?? "",
      lastName: userData.lastName ?? "",
      email: userData.email ?? "",
      phone: userData.phone ?? null,
      birthDate: isoToBirthDate(userData.birthDate) || null,
    });
  }, [userData, reset, open]);

  const handleSave = (data: UserFormSchema) => {
    const birthDateISO = birthDateToISO(data.birthDate ?? null);
    onSubmit({ ...data, birthDate: birthDateISO }, setOpen);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center cursor-pointer gap-2"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Perfil
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-md w-[90vw] max-w-[400px] sm:max-w-[500px] md:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar dados do perfil</DialogTitle>
          <DialogDescription>
            Atualize as informações pessoais e clique em "Salvar".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center pb-4">
              <EditableAvatar variant="user" data={userData} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Label className="sm:text-right">Nome</Label>
              <div className="sm:col-span-3 space-y-1">
                <Input {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Label className="sm:text-right">Sobrenome</Label>
              <div className="sm:col-span-3 space-y-1">
                <Input {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Label className="sm:text-right">Email</Label>
              <div className="sm:col-span-3 space-y-1">
                <Input disabled type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Label className="sm:text-right">WhatsApp</Label>
              <div className="sm:col-span-3 space-y-1">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      required={false}
                      value={field.value ?? ""}
                      label="phone"
                      onChange={(_, value) =>
                        field.onChange(value && value.trim() ? value : null)
                      }
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Label className="sm:text-right">Data de nascimento</Label>
              <div className="sm:col-span-3 space-y-1">
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <BirthDateInput
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val)}
                      onBlur={field.onBlur}
                      placeholder="dd/mm/aaaa"
                    />
                  )}
                />
                {errors.birthDate && (
                  <p className="text-xs text-destructive">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <OutlineButton type="button" onClick={() => setOpen(false)} />
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
