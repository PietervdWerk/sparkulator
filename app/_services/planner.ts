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

type Fraction = {
  numerator: bigint;
  denominator: bigint;
};

const ONE: Fraction = { numerator: 1n, denominator: 1n };

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

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a === 0n ? 1n : a;
}

function leastCommonMultiple(left: bigint, right: bigint): bigint {
  const a = left < 0n ? -left : left;
  const b = right < 0n ? -right : right;

  if (a === 0n || b === 0n) {
    return 0n;
  }

  return (a / greatestCommonDivisor(a, b)) * b;
}

function normalizeFraction({
  numerator,
  denominator,
}: Fraction): Fraction {
  if (denominator === 0n) {
    throw new Error("Invalid fraction with zero denominator.");
  }

  if (numerator === 0n) {
    return { numerator: 0n, denominator: 1n };
  }

  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);

  return {
    numerator: (numerator / divisor) * sign,
    denominator: (denominator / divisor) * sign,
  };
}

function fractionFromNumber(value: number): Fraction {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot convert a non-finite number into a fraction.");
  }

  const sign = value < 0 ? -1n : 1n;
  const normalized = Math.abs(value).toString().toLowerCase();
  const [mantissa, exponentPart] = normalized.split("e");
  const exponent = exponentPart ? Number(exponentPart) : 0;
  const [wholePart, decimalPart = ""] = mantissa.split(".");
  const digits = `${wholePart}${decimalPart}`.replace(/^0+(?=\d)/, "") || "0";
  let numerator = BigInt(digits);
  let denominator = 10n ** BigInt(decimalPart.length);

  if (exponent > 0) {
    numerator *= 10n ** BigInt(exponent);
  } else if (exponent < 0) {
    denominator *= 10n ** BigInt(-exponent);
  }

  return normalizeFraction({
    numerator: numerator * sign,
    denominator,
  });
}

function multiplyFractions(left: Fraction, right: Fraction): Fraction {
  return normalizeFraction({
    numerator: left.numerator * right.numerator,
    denominator: left.denominator * right.denominator,
  });
}

function divideFractions(left: Fraction, right: Fraction): Fraction {
  return normalizeFraction({
    numerator: left.numerator * right.denominator,
    denominator: left.denominator * right.numerator,
  });
}

function invertFraction(value: Fraction): Fraction {
  return normalizeFraction({
    numerator: value.denominator,
    denominator: value.numerator,
  });
}

function rationalLeastCommonMultiple(values: Fraction[]): Fraction {
  return values.reduce(
    (current, value) =>
      normalizeFraction({
        numerator: leastCommonMultiple(current.numerator, value.numerator),
        denominator: greatestCommonDivisor(
          current.denominator,
          value.denominator,
        ),
      }),
    ONE,
  );
}

function fractionToNumber(value: Fraction): number {
  return Number(value.numerator) / Number(value.denominator);
}

export function calculateBalancedTargetRate(
  item: ItemId,
  crewMultiplier: number,
  recipeChoice: RecipeChoice,
): number {
  const machineCoefficients: Fraction[] = [];
  const crewMultiplierFraction = fractionFromNumber(crewMultiplier);

  function walk(
    current: ItemId,
    currentRateCoefficient: Fraction,
    stack: ItemId[],
  ) {
    const recipe = getRecipeForProduct(current, recipeChoice);

    if (!recipe || recipe.workstation === "raw" || stack.includes(current)) {
      return;
    }

    const outputPerMachine = multiplyFractions(
      multiplyFractions(
        fractionFromNumber(recipe.cyclesPerMinuteOneStumpy),
        fractionFromNumber(recipe.productAmount),
      ),
      crewMultiplierFraction,
    );
    const machineCoefficient = divideFractions(
      currentRateCoefficient,
      outputPerMachine,
    );

    machineCoefficients.push(machineCoefficient);

    recipe.ingredients.forEach((ingredient) => {
      const ingredientRateCoefficient =
        ingredient.amount === undefined
          ? multiplyFractions(
              machineCoefficient,
              multiplyFractions(
                fractionFromNumber(ingredient.perMinuteOneStumpy ?? 0),
                crewMultiplierFraction,
              ),
            )
          : multiplyFractions(
              currentRateCoefficient,
              divideFractions(
                fractionFromNumber(ingredient.amount),
                fractionFromNumber(recipe.productAmount),
              ),
            );

      walk(ingredient.item, ingredientRateCoefficient, [...stack, current]);
    });
  }

  walk(item, ONE, []);

  if (machineCoefficients.length === 0) {
    return 0;
  }

  const oneMachineRates = machineCoefficients
    .filter((coefficient) => coefficient.numerator !== 0n)
    .map(invertFraction);

  if (oneMachineRates.length === 0) {
    return 0;
  }

  return fractionToNumber(rationalLeastCommonMultiple(oneMachineRates));
}

export function calculatePlan(
  item: ItemId,
  rate: number,
  crewMultiplier: number,
  recipeChoice: RecipeChoice,
): ProductionPlan {
  const raw = new Map<ItemId, number>();
  const machines = new Map<string, MachineSummary>();

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

    const outputPerMachine =
      recipe.cyclesPerMinuteOneStumpy * recipe.productAmount * crewMultiplier;
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
      machines: machineCount,
      children,
    };
  }

  const tree = walk(item, rate, [], []);

  return {
    tree,
    raw: [...raw.entries()].sort((a, b) =>
      items[a[0]].name.localeCompare(items[b[0]].name),
    ),
    machines: [...machines.values()].sort((a, b) =>
      workstations[a.recipe.workstation].name.localeCompare(
        workstations[b.recipe.workstation].name,
      ),
    ),
  };
}
