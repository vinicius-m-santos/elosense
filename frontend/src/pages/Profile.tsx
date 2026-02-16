import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";
import EditableAvatar from "@/components/ui/EditableAvatar";
import PreferencesSection from "@/components/Profile/PreferencesSection";
import ChangePasswordModal from "@/components/Profile/ChangePasswordModal";
import { SkeletonProfile } from "@/components/ui/skeleton";
import { useRequest } from "@/api/request";

const profileNameSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
});

type ProfileNameForm = z.infer<typeof profileNameSchema>;

export default function ProfilePage() {
  const { user, updateUser, isValidating } = useAuth();
  const request = useRequest();
  const [saving, setSaving] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileNameForm>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
    },
    values: {
      firstName: user?.firstName ?? "",
    },
  });

  const onSaveName = async (data: ProfileNameForm) => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await request({
        method: "patch",
        url: `/user/${user.id}`,
        data: { firstName: data.firstName },
      });
      updateUser({ ...user, ...updated });
    } finally {
      setSaving(false);
    }
  };

  const showSkeletons = !user || isValidating;

  return (
    <div className="min-h-screen w-full bg-zinc-100 text-zinc-900 transition-colors duration-500 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <AppHeader
        backTo="/"
        badgeLabel="Perfil"
        maxWidth="max-w-6xl"
      />

      <main className="relative z-10 mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">Perfil</h1>

        {showSkeletons ? (
          <SkeletonProfile />
        ) : user ? (
          <>
        <Card className="mb-6 border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <EditableAvatar variant="user" data={{ id: user.id, firstName: user.firstName, avatarUrl: user.avatarUrl }} />
              <div className="w-full min-w-0 flex-1 space-y-4">
                <form onSubmit={handleSubmit(onSaveName)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-500">Nome</label>
                    <Input
                      {...register("firstName")}
                      placeholder="Nome"
                      className="bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
                      disabled={saving}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-500">E-mail</label>
                    <Input
                      value={user.email ?? ""}
                      readOnly
                      disabled
                      className="bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
                    />
                    <p className="text-xs text-zinc-500">O e-mail não pode ser alterado aqui.</p>
                  </div>
                  {isDirty && (
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                    >
                      {saving ? "Salvando…" : "Salvar"}
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
          <Button
            variant="link"
            className="text-sm text-purple-400"
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Alterar senha
          </Button>
        </div>
        <ChangePasswordModal
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        />
          </>
        ) : null}
      </main>
      <AppFooter />
    </div>
  );
}
