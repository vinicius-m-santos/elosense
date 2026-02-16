import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserDropdownUser = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

type UserDropdownProps = {
  user: UserDropdownUser;
  className?: string;
};

export default function UserDropdown({ user, className }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Minha conta";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={cn("relative z-[100] inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "cursor-pointer inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:pl-2 sm:pr-3",
          "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-white/10",
          open && "bg-zinc-200/80 dark:bg-white/10"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar className="h-8 w-8 shrink-0 rounded-full border border-white/10">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-[100] mt-2 w-48 rounded-xl border py-1 shadow-lg",
            "border-zinc-200 bg-white/95 dark:border-white/10 dark:bg-zinc-900/95 backdrop-blur-xl",
            "text-zinc-900 dark:text-zinc-100"
          )}
        >
          <ul className="py-1 text-sm">
            <li>
              <Link
                to="/profile"
                className="flex w-full items-center px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <User size={16} className="mr-2 shrink-0" />
                Perfil
              </Link>
            </li>
            <li>
              <Link
                to="/logout"
                className="flex w-full items-center px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <LogOut size={16} className="mr-2 shrink-0" />
                Sair
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
