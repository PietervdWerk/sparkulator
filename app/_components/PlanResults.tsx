import { items, workstations } from "../_services/catalog";
import type { ItemId, ProductionPlan, TargetMode } from "../_services/types";
import { FlowGraph } from "./FlowGraph";
import { ItemIcon, WorkstationIcon } from "./icons";

type PlanResultsProps = {
  language: "en" | "de";
  plan: ProductionPlan;
  selectedItem: ItemId;
  target: number;
  targetMode: TargetMode;
  crewLabel: string;
  crewMultiplier: number;
  text: Record<string, string>;
  format: (value: number) => string;
};

export function PlanResults({
  language,
  plan,
  selectedItem,
  target,
  targetMode,
  crewLabel,
  crewMultiplier,
  text,
  format,
}: PlanResultsProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="surface overflow-hidden">
        <div className="surface-header px-4 py-3">
          <h2 className="text-lg font-bold">{text.flow}</h2>
        </div>
        <div>
          <FlowGraph
            key={plan.tree.key}
            language={language}
            tree={plan.tree}
            targetItem={selectedItem}
          />
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="surface-header flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold">{text.productionPlan}</h2>
          <span className="text-sm font-semibold text-[var(--muted)]">
            {text.machineCount}
          </span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {plan.machines.map(({ recipe, machines, rate }) => {
            const perMachine =
              recipe.cyclesPerMinuteOneStumpy *
              recipe.productAmount *
              crewMultiplier;

            return (
              <article
                className="grid gap-3 p-4 transition hover:bg-white/32 md:grid-cols-[auto_1fr_auto]"
                key={recipe.id}
              >
                <WorkstationIcon id={recipe.workstation} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">
                      {workstations[recipe.workstation].name}
                    </h3>
                    <span className="chip px-2 py-1 text-xs font-semibold text-[var(--evergreen)]">
                      {recipe.name}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                    <span>
                      {format(rate)}/min {text.output}
                    </span>
                    <span>
                      {format(perMachine)}/min {text.perMachine}
                    </span>
                    <a
                      className="font-semibold text-[var(--copper)] hover:underline"
                      href={recipe.wiki}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Wiki
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--evergreen)]">
                    {format(machines)}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copper)]">
                    {text.machines}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="surface overflow-hidden">
          <div className="surface-header px-4 py-3">
            <h2 className="text-lg font-bold">{text.rawDemand}</h2>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {plan.raw.map(([item, rate]) => (
              <div
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 transition hover:bg-white/32"
                key={item}
              >
                <ItemIcon item={item} size="sm" />
                <a
                  className="font-semibold text-[var(--foreground)] hover:text-[var(--copper)]"
                  href={items[item].wiki}
                  target="_blank"
                  rel="noreferrer"
                >
                  {items[item].name}
                </a>
                <div className="font-bold">{format(rate)}/min</div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-4">
          <h2 className="text-lg font-bold">{text.activeTarget}</h2>
          <div className="mt-4 flex items-center gap-3">
            <ItemIcon item={selectedItem} />
            <div>
              <div className="text-xl font-bold">{items[selectedItem].name}</div>
              <div className="text-sm text-[var(--muted)]">
                {format(target)}/min {text.with} {crewLabel}
                {targetMode === "auto" ? ` (${text.auto})` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
