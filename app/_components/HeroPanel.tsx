import { items } from "../_services/catalog";
import type { ItemId, TargetMode } from "../_services/types";
import { ItemIcon } from "./icons";

type HeroPanelProps = {
  selectedItem: ItemId;
  target: number;
  targetMode: TargetMode;
  crewLabel: string;
  totalMachines: number;
  rawInputCount: number;
  text: Record<string, string>;
  format: (value: number) => string;
};

export function HeroPanel({
  selectedItem,
  target,
  targetMode,
  crewLabel,
  totalMachines,
  rawInputCount,
  text,
  format,
}: HeroPanelProps) {
  return (
    <header className="hero-panel relative isolate overflow-hidden px-4 py-4 sm:px-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--copper)]">
            {text.activeTarget}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <ItemIcon item={selectedItem} />
            <div className="min-w-0">
              <h2 className="truncate text-3xl font-bold tracking-normal sm:text-5xl">
                {items[selectedItem].name}
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">
                {format(target)}/min {text.with} {crewLabel}
                {targetMode === "auto" ? ` (${text.auto})` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-[430px]">
          <div className="control-surface px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              {text.machines}
            </div>
            <div className="mt-2 text-3xl font-bold text-[var(--evergreen)]">
              {format(totalMachines)}
            </div>
          </div>
          <div className="control-surface px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              {text.rawInputs}
            </div>
            <div className="mt-2 text-3xl font-bold text-[var(--evergreen)]">
              {rawInputCount}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
