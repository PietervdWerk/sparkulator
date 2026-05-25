import {
  defaultRecipeIdByProduct,
  items,
  recipesByProduct,
  workstations,
} from "./catalog";
import type {
  ItemId,
  MachineSummary,
  PlanNode,
  ProductionPlan,
  RecipeChoice,
} from "./types";

const MACHINE_ROUNDING_EPSILON = 1e-9;

export function formatRate(value: number, locale = "en-US") {
  if (value >= 100) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(value);
}

export function getRecipeForProduct(
  item: ItemId,
  recipeChoice: RecipeChoice,
) {
  const candidates = recipesByProduct[item] ?? [];
  const chosenId =
    recipeChoice[item] ?? defaultRecipeIdByProduct[item] ?? candidates[0]?.id;

  return candidates.find((recipe) => recipe.id === chosenId) ?? candidates[0];
}

function getOutputPerMachine(
  item: ItemId,
  crewMultiplier: number,
  recipeChoice: RecipeChoice,
) {
  const recipe = getRecipeForProduct(item, recipeChoice);

  if (!recipe) {
    return 0;
  }

  return recipe.cyclesPerMinuteOneStumpy * recipe.productAmount * crewMultiplier;
}

function roundMachineCount(value: number) {
  if (value <= 0) {
    return 0;
  }

  return Math.ceil(value - MACHINE_ROUNDING_EPSILON);
}

export function calculateAutoTargetRate(
  item: ItemId,
  crewMultiplier: number,
  recipeChoice: RecipeChoice,
): number {
  return getOutputPerMachine(item, crewMultiplier, recipeChoice);
}

export function calculatePlan(
  item: ItemId,
  rate: number,
  crewMultiplier: number,
  recipeChoice: RecipeChoice,
  options?: {
    roundMachines?: boolean;
  },
): ProductionPlan {
  const raw = new Map<ItemId, number>();
  const machines = new Map<string, MachineSummary>();
  const roundMachines = options?.roundMachines ?? false;

  function walk(
    current: ItemId,
    currentRate: number,
    stack: ItemId[],
    trail: string[],
  ): PlanNode {
    const recipe = getRecipeForProduct(current, recipeChoice);

    if (!recipe) {
      raw.set(current, (raw.get(current) ?? 0) + currentRate);
      return {
        key: `${trail.join(".")}.${current}.raw.${raw.size}`,
        item: current,
        rate: currentRate,
        machines: 0,
        children: [],
      };
    }

    if (recipe.workstation === "raw") {
      raw.set(current, (raw.get(current) ?? 0) + currentRate);
      return {
        key: `${trail.join(".")}.${current}.${recipe.id}`,
        item: current,
        rate: currentRate,
        machines: 0,
        children: [],
      };
    }

    if (stack.includes(current)) {
      raw.set(current, (raw.get(current) ?? 0) + currentRate);
      return {
        key: `${trail.join(".")}.${current}.cycle`,
        item: current,
        rate: currentRate,
        recipe,
        machines: 0,
        children: [],
        cycle: true,
      };
    }

    const outputPerMachine = getOutputPerMachine(
      current,
      crewMultiplier,
      recipeChoice,
    );
    const machineCount = currentRate / outputPerMachine;
    const previous = machines.get(recipe.id);

    machines.set(recipe.id, {
      recipe,
      machines: (previous?.machines ?? 0) + machineCount,
      rate: (previous?.rate ?? 0) + currentRate,
    });

    const children = recipe.ingredients.map((ingredient, index) => {
      const ingredientRate =
        ingredient.amount === undefined
          ? machineCount * (ingredient.perMinuteOneStumpy ?? 0) * crewMultiplier
          : (currentRate / recipe.productAmount) * ingredient.amount;

      return walk(ingredient.item, ingredientRate, [...stack, current], [
        ...trail,
        `${current}-${index}`,
      ]);
    });

    return {
      key: `${trail.join(".")}.${current}.${recipe.id}`,
      item: current,
      rate: currentRate,
      recipe,
      machines: roundMachines ? roundMachineCount(machineCount) : machineCount,
      children,
    };
  }

  const tree = walk(item, rate, [], []);

  return {
    tree,
    raw: [...raw.entries()].sort((a, b) =>
      items[a[0]].name.localeCompare(items[b[0]].name),
    ),
    machines: [...machines.values()]
      .map((summary) => ({
        ...summary,
        machines: roundMachines
          ? roundMachineCount(summary.machines)
          : summary.machines,
      }))
      .sort((a, b) =>
        workstations[a.recipe.workstation].name.localeCompare(
          workstations[b.recipe.workstation].name,
        ),
      ),
  };
}
