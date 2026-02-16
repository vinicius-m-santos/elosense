"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { useRequest } from "@/api/request";
import { useAuth } from "@/providers/AuthProvider";

export default function PreferencesSection() {
  const { user, updateUser } = useAuth();
  const request = useRequest();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggle = async (field: "emailNotifications" | "appNotifications", value: boolean) => {
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
    } catch {
      // Error is handled by useRequest
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="text-zinc-600 dark:text-zinc-400" />
            <h3 className="text-lg font-semibold">Notificações</h3>
          </div>

          <Separator className="bg-zinc-200 dark:bg-white/10" />

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
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
