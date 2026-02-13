import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequest } from "@/api/request";
import AvatarLoader from "@/components/ui/avatarLoader";
import DeleteAvatarModal from "./DeleteAvatarModal";
import { UPLOAD_PROFILE_PHOTO_MAX_FILE_SIZE } from "@/utils/constants/Client/constants";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type UserData = {
  id: number;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

type ClientData = {
  id: number;
  name?: string;
  lastName?: string;
  user?: {
    avatarUrl?: string | null;
  };
};

type EditableAvatarProps =
  | {
    variant: "user";
    data: UserData;
  }
  | {
    variant: "client";
    data: ClientData;
  };

export default function EditableAvatar({ variant, data }: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const request = useRequest();
  const queryClient = useQueryClient();
  const { updateUser, user: currentUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(
    variant === "user" ? data.avatarUrl : data.user?.avatarUrl
  );
  const [fallbackInitials, setFallbackInitials] = useState<string>("");

  const entityId = data.id;

  useEffect(() => {
    if (!data) return;

    if (variant === "user") {
      const user = data as UserData;
      setAvatarUrl(user.avatarUrl);
      setFallbackInitials(
        `${user.firstName?.[0]?.toUpperCase() ?? ""}${user.lastName?.[0]?.toUpperCase() ?? ""}`
      );
    } else {
      const client = data as ClientData;
      setAvatarUrl(client.user?.avatarUrl);
      setFallbackInitials(
        `${client.name?.[0]?.toUpperCase() ?? ""}${client.lastName?.[0]?.toUpperCase() ?? ""}`
      );
    }
  }, [data, variant]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > UPLOAD_PROFILE_PHOTO_MAX_FILE_SIZE) {
        toast.error("Tamanho máximo de 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const basePath = variant === "user" ? "user" : "client";
      const url = await request({
        method: "POST",
        url: `/${basePath}/avatar/${entityId}`,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await request({
        method: "PATCH",
        url: `/${basePath}/${entityId}`,
        data: { avatarUrl: url },
      });

      return url;
    },
    onSuccess: (newUrl) => {
      setAvatarUrl(newUrl);

      if (variant === "user") {
        const updatedUser = currentUser
          ? { ...currentUser, avatarUrl: newUrl }
          : { ...(data as UserData), avatarUrl: newUrl };
        queryClient.setQueryData(["user", entityId], updatedUser);
        if (updateUser && currentUser) {
          updateUser({ ...currentUser, avatarUrl: newUrl });
        }
        if (currentUser?.client?.id) {
          const clientKey = String(currentUser.client.id);
          queryClient.setQueryData(["client", clientKey], (old: ClientData) =>
            old ? { ...old, user: { ...old?.user, avatarUrl: newUrl } } : old
          );
        }
      } else {
        queryClient.setQueryData(["client", String(entityId)], (old: ClientData) => ({
          ...old,
          user: { ...old?.user, avatarUrl: newUrl },
        }));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const basePath = variant === "user" ? "user" : "client";
      await request({
        method: "DELETE",
        url: `/${basePath}/avatar/${entityId}`,
      });
    },
    onSuccess: () => {
      setAvatarUrl(null);

      if (variant === "user") {
        const updatedUser = currentUser
          ? { ...currentUser, avatarUrl: null }
          : { ...(data as UserData), avatarUrl: null };
        queryClient.setQueryData(["user", entityId], updatedUser);
        if (updateUser && currentUser) {
          updateUser({ ...currentUser, avatarUrl: null });
        }
        if (currentUser?.client?.id) {
          const clientKey = String(currentUser.client.id);
          queryClient.setQueryData(["client", clientKey], (old: ClientData) =>
            old ? { ...old, user: { ...old?.user, avatarUrl: null } } : old
          );
        }
      } else {
        queryClient.setQueryData(["client", String(entityId)], (old: ClientData) => ({
          ...old,
          user: { ...old?.user, avatarUrl: null },
        }));
      }
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleClick = () => {
    if (uploadMutation.isPending || deleteMutation.isPending) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;
  const deleteModalTitle =
    variant === "user" ? "Remover foto do perfil?" : "Remover foto do aluno?";

  return (
    <div className="relative group">
      <Avatar
        key={avatarUrl ?? "no-avatar"}
        className="h-24 w-24 cursor-pointer ring-2 ring-muted/50 hover:ring-primary/50 transition-all"
        onClick={handleClick}
      >
        {avatarUrl ? (
          <AvatarImage
            key={avatarUrl}
            src={avatarUrl}
            alt={variant === "user" ? "Foto do perfil" : "Foto do cliente"}
            className="object-cover object-center"
          />
        ) : (
          <AvatarFallback className="bg-gray-200">
            {fallbackInitials || "?"}
          </AvatarFallback>
        )}

        {isLoading && <AvatarLoader />}
      </Avatar>


      {avatarUrl && !isLoading && (
        <>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Camera className="w-8 h-8 mb-0.5" strokeWidth={2} />
            <span className="text-xs font-medium">Trocar</span>
          </div>
          <div
            className="absolute w-10 h-10 bottom-0 left-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md pointer-events-none"
            title="Clique para alterar a foto"
            aria-hidden
          >
            <Camera className="w-4 h-4 m-auto h-full" strokeWidth={2} />
          </div>
        </>
      )}

      {!isLoading && avatarUrl && (
        <DeleteAvatarModal
          onConfirm={handleDelete}
          title={deleteModalTitle}
          children={
            <Button
              size="icon"
              variant="destructive"
              className="absolute cursor-pointer w-10 h-10 text-white rounded-full bottom-0 right-0 opacity-80 hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          }
        />
      )}

      {!avatarUrl && !isLoading && (
        <div
          className="absolute bottom-0 left-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md z-10 pointer-events-none"
          aria-hidden
        >
          <Camera className="w-4 h-4" strokeWidth={2} />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
    </div>
  );
}
