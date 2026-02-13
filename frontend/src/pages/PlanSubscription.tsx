"use client";

import { useRequest } from "@/api/request";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Calendar, RefreshCw } from "lucide-react";
import type { SubscriptionMe } from "@/types/subscription";
import Loader from "@/components/ui/loader";

export default function PlanSubscription() {
  const request = useRequest();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<SubscriptionMe>({
    queryKey: ["subscription", "me"],
    queryFn: async () => {
      const res = await request({
        method: "get",
        url: "/subscription/me",
        showError: true,
      });
      return res as SubscriptionMe;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: "always",
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader loading />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <p className="text-gray-600 mb-4">Não foi possível carregar os dados do plano.</p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Carregando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  const { plan, subscription, usage } = data;
  const limitLabel =
    usage.students_limit === null
      ? "Ilimitado"
      : `${usage.students_used} / ${usage.students_limit}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-wide mb-6">
        Plano e Assinatura
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Plano atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xl font-semibold text-gray-800">{plan.name}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Alunos: {limitLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Status:{" "}
              {subscription.status === "active"
                ? "Ativo"
                : subscription.status === "expired"
                  ? "Expirado"
                  : subscription.status}
            </span>
          </div>
          {subscription.is_lifetime && (
            <p className="text-sm text-green-700 font-medium">Plano vitalício</p>
          )}
          {subscription.ends_at && !subscription.is_lifetime && (
            <p className="text-sm text-gray-600">
              Válido até:{" "}
              {new Date(subscription.ends_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-gray-500">
        Em breve teremos planos pagos com mais vagas para alunos. Você será avisado.
      </p>
    </div>
  );
}
