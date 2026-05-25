export type ItemId =
  | "arty-spark"
  | "carry-spark"
  | "choppy-spark"
  | "coal"
  | "crafty-spark"
  | "fabric"
  | "fertiliser"
  | "ladder"
  | "leaves"
  | "loamy-spark"
  | "rope"
  | "sawn-timber"
  | "stumpy-spark"
  | "tree-bark"
  | "wooden-blade"
  | "wooden-log"
  | "wooden-panel"
  | "big-vial"
  | "boomy-spark"
  | "coral"
  | "crashy-spark"
  | "dowsing-stone"
  | "explosive"
  | "fluted-coral"
  | "gas-poison"
  | "hauling-spark"
  | "limestone"
  | "miasma-vial"
  | "path-tile"
  | "pebble"
  | "puffy-spark"
  | "quartz"
  | "raw-aether"
  | "refined-aether"
  | "rocky-spark"
  | "scouty-spark"
  | "slashy-spark"
  | "small-vial"
  | "stone"
  | "stone-plate"
  | "stone-spike"
  | "stone-wheel"
  | "aether-apple"
  | "aether-crystal"
  | "aether-flower"
  | "aether-seed"
  | "aether-segment"
  | "aether-shard"
  | "aetheric-clump"
  | "aetheric-pellet"
  | "beelephant-carapace"
  | "bumpy-geode"
  | "burning-spark"
  | "clay"
  | "cleansing-fragment"
  | "copper-cuttings"
  | "copper-ingot"
  | "copper-ore"
  | "copper-sap"
  | "copper-seed"
  | "coral-seed"
  | "corrupted-aether"
  | "corrupted-spark-token"
  | "cracked-geode"
  | "crangolin-lavascale"
  | "crangolin-scale"
  | "drill-bit"
  | "drilly-spark"
  | "fireshroom-cluster"
  | "fog"
  | "freezing-spark"
  | "frilled-walrion-tusk"
  | "frost"
  | "frowl-sac"
  | "frozen-log"
  | "frozen-stone"
  | "geode-cluster"
  | "glowshroom"
  | "grey-aether"
  | "handy-spark"
  | "icehorn-ram-horn"
  | "lava-cap"
  | "lava-shellhorse-comb"
  | "leaf-knot"
  | "liquid-fertiliser"
  | "liquid-fertilizer"
  | "mantis-stag-antler"
  | "miasma"
  | "pengus-tendon"
  | "rock-teron-shell"
  | "scrubby-spark"
  | "shiny-geode"
  | "sponge"
  | "squilican-tube"
  | "stellar-fertiliser"
  | "stellar-fertilizer"
  | "stellar-ice"
  | "stellar-leaves"
  | "stellar-seed"
  | "stone-block"
  | "volcanic-soil";

export type WorkstationId =
  | "raw"
  | "logger"
  | "sawbench"
  | "loom"
  | "cutter"
  | "wood-workshop"
  | "furnace"
  | "drill"
  | "ore-miner"
  | "stonecutter"
  | "stone-workshop"
  | "spark-workbench"
  | "spark-workstation"
  | "metal-spark-workstation"
  | "alchemy-station"
  | "aetheric-collider"
  | "extractor"
  | "plant-extractor"
  | "geode-breaker"
  | "compressor"
  | "clay-digger";

export type Ingredient = {
  item: ItemId;
  amount?: number;
  perMinuteOneStumpy?: number;
};

export type Recipe = {
  id: string;
  name: string;
  product: ItemId;
  productAmount: number;
  workstation: WorkstationId;
  duration: number;
  cyclesPerMinuteOneStumpy: number;
  ingredients: Ingredient[];
  wiki: string;
};

export type PlanNode = {
  key: string;
  item: ItemId;
  rate: number;
  recipe?: Recipe;
  machines: number;
  children: PlanNode[];
  cycle?: boolean;
};

export type MachineSummary = {
  recipe: Recipe;
  machines: number;
  rate: number;
};

export type ProductionPlan = {
  tree: PlanNode;
  raw: [ItemId, number][];
  machines: MachineSummary[];
};

export type Language = "en" | "de";

export type RecipeChoice = Partial<Record<ItemId, string>>;

export type TargetMode = "manual" | "auto";
