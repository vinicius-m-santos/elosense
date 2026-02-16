"use client";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { Zap, Moon, Sun, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UserDropdown from "@/components/Menu/components/UserDropdown";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

export type AppHeaderProps = {
  /** Rota ao clicar em voltar; omitir ou null = sem botão de voltar */
  backTo?: string | null;
  /** Texto do badge (ex.: "Beta", "Dashboard", "Perfil") */
  badgeLabel: string;
  /** Classe de largura máxima (ex.: max-w-6xl, max-w-7xl). Default max-w-6xl */
  maxWidth?: string;
  /** State para navegação ao voltar (ex.: state do MatchDetail para Dashboard) */
  backState?: unknown;
};

export default function AppHeader({
  backTo,
  badgeLabel,
  maxWidth = "max-w-6xl",
  backState,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isValidating } = useAuth();
  const isLoginPage = location.pathname === "/login";
  const { dark, onDarkChange } = useTheme();

  return (
    <header className="relative z-20 border-b border-zinc-200/80 dark:border-white/5 backdrop-blur-xl">
      <div
        className={`mx-auto flex flex-row items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4 ${maxWidth}`}
      >
        {/* Left: back (optional) + logo + badge */}
        <div className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {backTo != null && backTo !== "" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-zinc-600 dark:text-zinc-400 hover:bg-white/10 hover:text-zinc-100 sm:h-11 sm:w-11"
              onClick={() => navigate(backTo, backState != null ? { state: backState } : undefined)}
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <div className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
            <Zap className="h-5 w-5 shrink-0 text-purple-400" />
            <span className="truncate text-base sm:text-lg">EloSense</span>
            <Badge className="ml-0.5 shrink-0 bg-purple-500/10 text-purple-400 border-purple-500/20 sm:ml-2">
              {badgeLabel}
            </Badge>
          </div>
        </div>

        {/* Right: theme (mesmo botão para todos) + auth (Entrar or UserDropdown) */}
        <div className="flex min-h-[44px] shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-zinc-600 dark:text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            onClick={() => onDarkChange(!dark)}
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {dark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {isValidating ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ) : isAuthenticated && user ? (
            <UserDropdown user={user} />
          ) : (
            !isLoginPage && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] shrink-0 px-3 text-zinc-900 dark:text-zinc-100 hover:bg-white/10 sm:min-h-0"
                asChild
              >
                <Link to="/login">Entrar</Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
