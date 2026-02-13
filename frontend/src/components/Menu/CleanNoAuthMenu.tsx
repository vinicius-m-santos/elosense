import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Zap } from "lucide-react";

const CleanNoAuthMenu = () => {
  const [dark, setDark] = useState(true);

  return (
    <header className="relative z-10 border-b border-white/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Zap className="h-5 w-5 text-purple-400" />
          <span className="text-lg">EloSense</span>
          <Badge
            variant="secondary"
            className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20"
          >
            Beta
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Sun className="h-4 w-4 opacity-60" />
          <Switch checked={dark} onCheckedChange={setDark} />
          <Moon className="h-4 w-4 opacity-60" />
        </div>
      </div>
    </header>
  );
};

export default CleanNoAuthMenu;
