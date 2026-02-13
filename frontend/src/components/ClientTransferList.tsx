import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ChevronDown,
  ChevronsDown,
  ChevronUp,
  ChevronsUp,
} from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";

export type ClientItem = { id: number; name: string; lastName: string };

function matchesQuery(c: ClientItem, q: string) {
  const low = q.toLowerCase();
  const name = c.name.toLowerCase();
  const lastName = c.lastName.toLowerCase();
  const fullName = `${name} ${lastName}`;
  const fullNameReversed = `${lastName} ${name}`;
  return (
    name.includes(low) ||
    lastName.includes(low) ||
    fullName.includes(low) ||
    fullNameReversed.includes(low)
  );
}

type Props = {
  available: ClientItem[];
  selected: ClientItem[];
  onMoveToSelected: (items: ClientItem[]) => void;
  onMoveToAvailable: (items: ClientItem[]) => void;
  onMoveAllToSelected: () => void;
  onMoveAllToAvailable: () => void;
  availableFilter: string;
  onAvailableFilterChange: (v: string) => void;
  selectedFilter: string;
  onSelectedFilterChange: (v: string) => void;
  loading: boolean;
};

export function ClientTransferList({
  available,
  selected,
  onMoveToSelected,
  onMoveToAvailable,
  onMoveAllToSelected,
  onMoveAllToAvailable,
  availableFilter,
  onAvailableFilterChange,
  selectedFilter,
  onSelectedFilterChange,
  loading,
}: Props) {
  const filteredAvailable = useMemo(() => {
    if (!availableFilter.trim()) return available;
    return available.filter((c) => matchesQuery(c, availableFilter.trim()));
  }, [available, availableFilter]);

  const filteredSelected = useMemo(() => {
    if (!selectedFilter.trim()) return selected;
    return selected.filter((c) => matchesQuery(c, selectedFilter.trim()));
  }, [selected, selectedFilter]);

  const [availableChosen, setAvailableChosen] = useState<number[]>([]);
  const [selectedChosen, setSelectedChosen] = useState<number[]>([]);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const toggleAvailable = (id: number) => {
    setAvailableChosen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleSelected = (id: number) => {
    setSelectedChosen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMoveToSelected = () => {
    const items = available.filter((c) => availableChosen.includes(c.id));
    const movedIds = items.map((c) => c.id);
    onMoveToSelected(items);
    setAvailableChosen((prev) => prev.filter((id) => !movedIds.includes(id)));
  };
  const handleMoveToAvailable = () => {
    const items = selected.filter((c) => selectedChosen.includes(c.id));
    const movedIds = items.map((c) => c.id);
    onMoveToAvailable(items);
    setSelectedChosen((prev) => prev.filter((id) => !movedIds.includes(id)));
  };

  const label = (c: ClientItem) => `${c.name} ${c.lastName}`.trim();

  const listPanel = "border rounded-lg flex flex-col overflow-hidden";
  const listHeader = "p-2 border-b bg-muted/50";
  const listBody =
    "flex-1 overflow-y-auto p-2 min-h-[140px] max-h-[200px] md:min-h-0 md:max-h-none";
  const listFooter = "p-2 border-t bg-muted/30 text-xs text-muted-foreground";

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:items-stretch md:min-h-[320px]">
      <div className={listPanel}>
        <div className={listHeader}>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={availableFilter}
              onChange={(e) => onAvailableFilterChange(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
        <div className={listBody}>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Carregando...</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum aluno disponível
            </p>
          ) : (
            <ul className="space-y-1">
              {filteredAvailable.map((c) => (
                <li
                  key={c.id}
                  onClick={() => toggleAvailable(c.id)}
                  className={cn(
                    "text-sm px-3 py-2 rounded-md cursor-pointer transition-colors",
                    availableChosen.includes(c.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {label(c)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={listFooter}>{available.length} aluno(s)</div>
      </div>

      <div className="flex flex-row md:flex-col justify-center items-center gap-2 md:py-0 md:px-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={handleMoveToSelected}
          disabled={availableChosen.length === 0}
          title="Adicionar selecionados"
        >
          {isMobile ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={onMoveAllToSelected}
          disabled={available.length === 0}
          title="Adicionar todos"
        >
          {isMobile ? (
            <ChevronsDown className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={handleMoveToAvailable}
          disabled={selectedChosen.length === 0}
          title="Remover selecionados"
        >
          {isMobile ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={onMoveAllToAvailable}
          disabled={selected.length === 0}
          title="Remover todos"
        >
          {isMobile ? (
            <ChevronsUp className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className={listPanel}>
        <div className={listHeader}>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={selectedFilter}
              onChange={(e) => onSelectedFilterChange(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
        <div className={listBody}>
          {filteredSelected.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum aluno selecionado
            </p>
          ) : (
            <ul className="space-y-1">
              {filteredSelected.map((c) => (
                <li
                  key={c.id}
                  onClick={() => toggleSelected(c.id)}
                  className={cn(
                    "text-sm px-3 py-2 rounded-md cursor-pointer transition-colors",
                    selectedChosen.includes(c.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {label(c)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={listFooter}>{selected.length} selecionado(s)</div>
      </div>
    </div>
  );
}
