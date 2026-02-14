import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Zap, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/providers/AuthProvider";
import UserDropdown from "@/components/Menu/components/UserDropdown";
import EditableAvatar from "@/components/ui/EditableAvatar";
import PreferencesSection from "@/components/Profile/PreferencesSection";
import { useRequest } from "@/api/request";

const profileNameSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
});

type ProfileNameForm = z.infer<typeof profileNameSchema>;

export default function ProfilePage() {
  const [dark, setDark] = useState(true);
  const { user, updateUser } = useAuth();
  const request = useRequest();
  const [saving, setSaving] = useState(false);

  const isDark = dark;
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";
  const bgMain = isDark ? "bg-zinc-950" : "bg-zinc-100";
  const glassCard = isDark
    ? "border-white/10 bg-white/5 backdrop-blur-xl"
    : "border-zinc-200/80 bg-white/80 backdrop-blur-xl";
  const inputClass = isDark
    ? "bg-white/5 border-white/10 focus-visible:ring-purple-500 text-zinc-100"
    : "bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileNameForm>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  const onSaveName = async (data: ProfileNameForm) => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await request({
        method: "patch",
        url: `/user/${user.id}`,
        data: { firstName: data.firstName, lastName: data.lastName },
      });
      updateUser({ ...user, ...updated });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${bgMain} ${textPrimary}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <header
        className={`relative z-10 border-b ${isDark ? "border-white/5" : "border-zinc-200/80"} backdrop-blur-xl`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Zap className="h-5 w-5 text-purple-400" />
            <span className="text-lg">EloSense</span>
            <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">
              Beta
            </Badge>
          </Link>
          <div className="flex items-center gap-3">
            <UserDropdown user={user} isDark={isDark} />
            <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
            <Switch checked={dark} onCheckedChange={setDark} />
            <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">Perfil</h1>

        <Card className={`mb-6 ${glassCard}`}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <EditableAvatar variant="user" data={userData} />
              <div className="w-full min-w-0 flex-1 space-y-4">
                <form onSubmit={handleSubmit(onSaveName)} className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-sm ${textMuted}`}>Nome</label>
                    <Input
                      {...register("firstName")}
                      placeholder="Nome"
                      className={inputClass}
                      disabled={saving}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${textMuted}`}>Sobrenome</label>
                    <Input
                      {...register("lastName")}
                      placeholder="Sobrenome"
                      className={inputClass}
                      disabled={saving}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${textMuted}`}>E-mail</label>
                    <Input
                      value={user.email ?? ""}
                      readOnly
                      disabled
                      className={inputClass}
                    />
                    <p className="text-xs text-zinc-500">O e-mail não pode ser alterado aqui.</p>
                  </div>
                  {isDirty && (
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                    >
                      {saving ? "Salvando…" : "Salvar nome"}
                    </Button>
                  )}
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Preferências</h2>
          <PreferencesSection />
        </section>

        <div className="mt-6 text-center">
          <Button variant="link" className="text-sm text-purple-400" asChild>
            <Link to="/forgot-password">Alterar senha</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
