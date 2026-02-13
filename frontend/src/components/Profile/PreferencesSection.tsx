"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dumbbell,
  Bell,
  Globe,
} from "lucide-react";
import { useRequest } from "@/api/request";
import { useAuth } from "@/providers/AuthProvider";

export default function PreferencesSection() {
  const { user, updateUser } = useAuth();
  const request = useRequest();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggle = async (field: "emailNotifications" | "appNotifications" | "showPlatformExercises", value: boolean) => {
    if (!user) return;

    setIsLoading(field);
    try {
      const updatedUser = await request({
        method: "patch",
        url: `/user/${user.id}/preferences`,
        data: { [field]: value },
        showSuccess: false,
      });
      updateUser({ ...user, ...updatedUser });
    } catch (error) {
      // Error is handled by useRequest
    } finally {
      setIsLoading(null);
    }
  };

  const isPersonal = user?.roles?.includes("ROLE_PERSONAL");
  const showPlatformExercises = user?.personal?.showPlatformExercises ?? true;

  return (
    <div className="space-y-6">
      {/* Language */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">Idioma</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Idioma da interface</p>
              <p className="text-xs text-muted-foreground">
                Português (Brasil)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">Notificações</h3>
          </div>

          <Separator />

          <div className="space-y-3">
            <PreferenceItem
              label="Notificações por e-mail"
              description="Receber atualizações importantes por e-mail"
              checked={user?.emailNotifications ?? true}
              onCheckedChange={(checked) => handleToggle("emailNotifications", checked)}
              disabled={isLoading === "emailNotifications"}
            />

            <PreferenceItem
              label="Notificações no app"
              description="Receber alertas dentro da aplicação"
              checked={user?.appNotifications ?? true}
              onCheckedChange={(checked) => handleToggle("appNotifications", checked)}
              disabled={isLoading === "appNotifications"}
            />
          </div>
        </CardContent>
      </Card>

      {isPersonal && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="text-muted-foreground" />
              <h3 className="text-lg font-semibold">Exercícios</h3>
            </div>
            <Separator />
            <PreferenceItem
              label="Exercícios da plataforma"
              description="Exibir exercícios originais cadastrados pela plataforma na lista e no cadastro de treinos"
              checked={showPlatformExercises}
              onCheckedChange={(checked) => handleToggle("showPlatformExercises", checked)}
              disabled={isLoading === "showPlatformExercises"}
            />
        </CardContent>
      </Card>
      )}
    </div>
  );
}

function PreferenceItem({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
