export interface Skill {
  skillName: string;
  cooldown: number[];
  cost: number[];
  skillDesc: string;
  skillImg: string;
}

export interface SkinCollabTag {
  name: string;
  color: string;
}

export interface Skin {
  skinName: string;
  skinImg?: string; // Old format (camp)
  skinCover?: string; // New format (world)
  skinImage?: string; // New format (world)
  skinImage2?: string; // New format (world)
  skinSeries?: string; // New format (world)
  skinLink?: string; // New format (world)
  // Tier info
  tier?: string; // NO_TAG, RARE, EPIC, LEGEND, PRECIOUS, MYTHIC, FLAWLESS
  tierName?: string; // Display name
  tierColor?: string; // Hex color
  collab?: SkinCollabTag; // Collaboration tag
  tag?: string; // Special tag (LIMITED, BLESSED, etc.)
}

export interface HeroRelation {
  name: string;
  thumbnail: string;
  description: string;
  url: string;
}

export interface HeroStats {
  winRate: string;
  pickRate: string;
  banRate: string;
  tier: string;
}

export interface HeroWorld {
  region: string;
  identity: string;
  energy: string;
  height?: string;
}

export interface Arcana {
  id: number;
  name: string;
  icon: string;
  description: string;
  level: number;
  color: number;
}

export interface PassiveSkill {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  name: string;
  icon: string;
  description: string;
  price: number;
  type: number;
  level: number;
  isCore: boolean;
  passiveSkills: PassiveSkill[];
}

export interface Hero {
  title: string;
  name: string;
  heroId: number;
  role: string;
  lane: string;
  lanes?: string[];
  icon: string;
  cardImage?: string;
  painting?: string;
  squarehead?: string;
  skill: Skill[];
  skillSets?: { name: string; skills: Skill[] }[];
  skins: Skin[];
  survivalPercentage: string;
  attackPercentage: string;
  abilityPercentage: string;
  difficultyPercentage: string;
  arcana: Arcana[];
  recommendedEquipment: Equipment[];
  buildTitle: string;
  bestPartners: Record<string, HeroRelation>;
  suppressingHeroes: Record<string, HeroRelation>;
  suppressedHeroes: Record<string, HeroRelation>;
  stats: HeroStats;
  world: HeroWorld;
  speciality?: string[];
}

export interface ApiResponse {
  main: Record<string, Hero>;
}

export type HeroRole = 'Tank' | 'Fighter' | 'Assassin' | 'Mage' | 'Marksman' | 'Support';

export type TierRank = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface HeroFilter {
  role?: HeroRole | 'All';
  lane?: string | 'All';
  specialty?: string | 'All';
  search?: string;
}

export interface HeroSortOption {
  field: 'name' | 'winRate' | 'pickRate' | 'banRate' | 'tier';
  order: 'asc' | 'desc';
}

// Item/Equipment types
export interface ItemEffect {
  effectType: number;
  valueType: number;
  value: number;
}

export interface ItemPassiveSkill {
  id: number;
  description: string;
}

export interface ItemReference {
  id: number;
  name: string;
  icon: string;
  price?: number;
}

export interface Item {
  id: number;
  name: string;
  icon: string;
  description: string;
  price: number;
  type: number;
  typeName: string;
  level: number;
  levelName: string;
  isTopEquip: boolean;
  buildsFrom: ItemReference[];
  upgradesTo: ItemReference[];
  passiveSkills: ItemPassiveSkill[];
  effects: ItemEffect[];
}

// Arcana types
export interface ArcanaEffect {
  effectType: number;
  valueType: number;
  value: number;
}

export interface Arcana {
  id: number;
  name: string;
  icon: string;
  level: number;
  description: string;
  color: number;
  colorName: string;
  role?: string;
  effects: ArcanaEffect[];
}
