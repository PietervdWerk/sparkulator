import Image from "next/image";

import {
  crewOptions,
  defaultRecipeIdByProduct,
  itemPhases,
  items,
  outputItems,
  recipesByProduct,
  workstations,
  type CrewOptionId,
} from "../_services/catalog";
import type { ItemId, RecipeChoice, TargetMode } from "../_services/types";
import { ItemIcon } from "./icons";

type PlannerSidebarProps = {
  selectedItem: ItemId;
  targetRate: number;
  targetMode: TargetMode;
  autoTargetRate: number;
  crewOptionId: CrewOptionId;
  itemMenuOpen: boolean;
  recipeChoice: RecipeChoice;
  text: Record<string, string>;
  format: (value: number) => string;
  onSelectedItemChange: (item: ItemId) => void;
  onTargetRateChange: (rate: number) => void;
  onTargetModeChange: (mode: TargetMode) => void;
  onCrewOptionChange: (crewOptionId: CrewOptionId) => void;
  onItemMenuOpenChange: (open: boolean) => void;
  onRecipeChoiceChange: (item: ItemId, recipeId: string) => void;
};

type ItemPickerPanelProps = {
  selectedItem: ItemId;
  onSelectedItemChange: (item: ItemId) => void;
  onItemMenuOpenChange: (open: boolean) => void;
};

export function PlannerSidebar({
  selectedItem,
  targetRate,
  targetMode,
  autoTargetRate,
  crewOptionId,
  itemMenuOpen,
  recipeChoice,
  text,
  format,
  onSelectedItemChange,
  onTargetRateChange,
  onTargetModeChange,
  onCrewOptionChange,
  onItemMenuOpenChange,
  onRecipeChoiceChange,
}: PlannerSidebarProps) {
  const recipeOptions = outputItems.filter(
    (item) => (recipesByProduct[item]?.length ?? 0) > 1,
  );
  const targetHintId = "target-rate-hint";

  return (
    <aside className="grid content-start gap-3 lg:sticky lg:top-4 lg:self-start">
      <div className="surface relative z-30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            className="text-sm font-semibold text-[var(--evergreen)]"
            htmlFor="target-rate"
          >
            {text.targetRate}
          </label>
          <div className="flex rounded-md border border-white/50 bg-white/35 p-1 shadow-inner backdrop-blur">
            {(["manual", "auto"] as const).map((mode) => {
              const active = targetMode === mode;

              return (
                <button
                  aria-pressed={active}
                  className={`rounded-[5px] px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-[#274238] text-white shadow-sm"
                      : "text-[var(--muted)] hover:bg-white/65"
                  }`}
                  key={mode}
                  type="button"
                  onClick={() => onTargetModeChange(mode)}
                >
                  {mode === "manual" ? text.manual : text.auto}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[auto_1fr_auto] gap-3">
          <div>
            <button
              aria-controls="item-picker"
              aria-expanded={itemMenuOpen}
              aria-label={`${text.chooseItem}: ${items[selectedItem].name}`}
              className="icon-frame grid h-12 w-12 place-items-center transition hover:-translate-y-0.5 hover:border-[var(--aether)]/45 hover:bg-white/75"
              title={items[selectedItem].name}
              type="button"
              onClick={() => onItemMenuOpenChange(!itemMenuOpen)}
            >
              <Image
                className="h-9 w-9 object-contain"
                src={items[selectedItem].image}
                alt=""
                width={40}
                height={40}
              />
            </button>
          </div>
          <input
            aria-describedby={targetMode === "auto" ? targetHintId : undefined}
            id="target-rate"
            className="control-surface h-12 min-w-0 px-3 text-lg font-semibold outline-none transition focus:border-[var(--aether)]/55 focus:ring-2 focus:ring-[var(--aether)]/20"
            min="0"
            readOnly={targetMode === "auto"}
            step="0.25"
            type="number"
            value={targetMode === "auto" ? autoTargetRate : targetRate}
            onChange={(event) =>
              onTargetRateChange(
                event.currentTarget.value === ""
                  ? 0
                  : event.currentTarget.valueAsNumber,
              )
            }
          />
          <span className="grid h-12 place-items-center rounded-md border border-white/45 bg-white/35 px-3 text-sm font-semibold text-[var(--muted)] shadow-inner backdrop-blur">
            /min
          </span>
        </div>
        {targetMode === "auto" ? (
          <p
            className="mt-2 text-xs font-medium text-[var(--muted)]"
            id={targetHintId}
          >
            {text.autoTargetHint}
          </p>
        ) : null}
        {itemMenuOpen ? (
          <div
            className="popover-surface absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,560px)] overflow-y-auto p-2.5"
            id="item-picker"
          >
            <ItemPickerContent
              selectedItem={selectedItem}
              onSelectedItemChange={onSelectedItemChange}
              onItemMenuOpenChange={onItemMenuOpenChange}
            />
          </div>
        ) : null}
      </div>

      <div className="surface relative z-20 p-4">
        <div className="text-sm font-semibold text-[var(--evergreen)]">
          {text.crewPerMachine}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {crewOptions.map((option) => {
            const active = crewOptionId === option.id;

            return (
              <button
                key={option.id}
                className={`grid min-h-20 gap-1 rounded-md border px-2 py-2 text-sm font-bold transition hover:-translate-y-0.5 ${
                  active
                    ? "border-[var(--copper)]/45 bg-white/75 text-[var(--foreground)] shadow-sm ring-2 ring-[var(--copper)]/18"
                    : "border-white/45 bg-white/35 text-[var(--ink-soft)] shadow-sm hover:border-[var(--copper)]/38 hover:bg-white/70"
                }`}
                title={`${option.label}: ${format(option.multiplier)}x`}
                type="button"
                onClick={() => onCrewOptionChange(option.id)}
              >
                <span className="flex items-center justify-center -space-x-2">
                  {option.sparks.map((spark, index) => (
                    <span
                      className="icon-frame grid h-9 w-9 place-items-center bg-white/70"
                      key={`${option.id}-${spark}-${index}`}
                    >
                      <Image
                        className="h-8 w-8 object-contain"
                        src={items[spark].image}
                        alt=""
                        width={34}
                        height={34}
                      />
                    </span>
                  ))}
                </span>
                <span className="truncate text-xs">{option.label}</span>
                <span className="text-xs text-[var(--copper)]">
                  {format(option.multiplier)}x
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="surface relative z-10 p-4">
        <h2 className="text-lg font-bold">{text.recipeRules}</h2>
        <div className="mt-3 grid gap-3">
          {recipeOptions.map((item) => (
            <label className="grid gap-2" key={item}>
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--evergreen)]">
                <ItemIcon item={item} size="sm" />
                {items[item].name}
              </span>
              <select
                className="control-surface h-11 bg-white/45 px-3 text-sm font-semibold outline-none focus:border-[var(--aether)]/55 focus:ring-2 focus:ring-[var(--aether)]/20"
                value={
                  recipeChoice[item] ??
                  defaultRecipeIdByProduct[item] ??
                  recipesByProduct[item]?.[0]?.id
                }
                onChange={(event) =>
                  onRecipeChoiceChange(item, event.currentTarget.value)
                }
              >
                {recipesByProduct[item]?.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {workstations[recipe.workstation].name} - {recipe.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ItemPickerContent({
  selectedItem,
  onSelectedItemChange,
  onItemMenuOpenChange,
}: ItemPickerPanelProps) {
  const outputItemsByPhase = itemPhases
    .map((phase) => ({
      ...phase,
      items: outputItems.filter((item) => items[item].phase === phase.id),
    }))
    .filter((phase) => phase.items.length > 0);

  return (
    <div className="grid gap-3">
      {outputItemsByPhase.map((phase) => (
        <section className="grid gap-2" key={phase.id}>
          <div className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--copper)]">
            {phase.label}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(42px,1fr))] gap-2">
            {phase.items.map((item) => {
              const active = selectedItem === item;

              return (
                <button
                  aria-label={items[item].name}
                  className={`grid h-12 min-w-12 place-items-center rounded-md border transition hover:-translate-y-0.5 ${
                    active
                      ? "border-[var(--aether)] bg-white/75 shadow-sm ring-2 ring-[var(--aether)]/20"
                      : "border-white/45 bg-white/35 shadow-sm hover:border-[var(--aether)]/45 hover:bg-white/70"
                  }`}
                  key={item}
                  title={items[item].name}
                  type="button"
                  onClick={() => {
                    onSelectedItemChange(item);
                    onItemMenuOpenChange(false);
                  }}
                >
                  <Image
                    className="h-9 w-9 object-contain"
                    src={items[item].image}
                    alt=""
                    width={40}
                    height={40}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
