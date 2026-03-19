const API_BASE = import.meta.env.DEV ? 'http://localhost:8090' : 'https://mlbbapi.project-n.site';

export type EmblemId = 'common' | 'tank' | 'assassin' | 'mage' | 'fighter' | 'support' | 'marksman';

export interface TalentDef {
  name: string;
  icon: string;
  effect: string;
}

export interface EmblemDef {
  id: EmblemId;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  attrs: string[];
  standard: TalentDef[];
  core: TalentDef[];
}

function t(name: string, file: string, effect: string): TalentDef {
  return { name, icon: `${API_BASE}/images/talents/${file}`, effect };
}

export const EMBLEMS: EmblemDef[] = [
  {
    id: 'common', name: 'Common',
    icon: `${API_BASE}/images/emblems/common.webp`,
    color: '#A3A3A3', bg: 'rgba(163,163,163,0.12)', border: 'rgba(163,163,163,0.35)',
    attrs: ['HP +275', 'Hybrid Regen +12', 'Adaptive Attack +22'],
    standard: [
      t('Thrill',              'Thrill.webp',             '+16 Adaptive Attack'),
      t('Swift',               'Swift.webp',              '+10% Attack Speed'),
      t('Wilderness Blessing', 'Wilderness_Blessing.webp', '+10% Move Speed in Jungle & River (halved in combat)'),
      t('Seasoned Hunter',     'Seasoned_Hunter.webp',     '+15% damage to Lord & Turtle; halved vs regular creeps'),
    ],
    core: [
      t('Impure Rage',    'Impure_Rage.webp',    'Skills deal 4% of target Max HP extra Adaptive Damage & restore 2% Mana. CD 5s'),
      t('Quantum Charge', 'Quantum_Charge.webp', 'Basic attacks boost Move Speed 30% & restore 75–180 HP. CD 8s'),
      t('War Cry',        'War_Cry.webp',        'After 3 separate hits on an enemy hero, +8% all damage for 6s. CD 6s'),
      t('Temporal Reign', 'Temporal_Reign.webp', "Next ultimate reduces other skills' cooldowns by 1.5× for 4s. CD 20s"),
    ],
  },
  {
    id: 'tank', name: 'Tank',
    icon: `${API_BASE}/images/emblems/tank.webp`,
    color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)',
    attrs: ['HP +500', 'Hybrid Defense +10', 'HP Regen +4'],
    standard: [
      t('Vitality', 'Vitality.webp', '+225 Max HP'),
      t('Tenacity', 'Tenacity.webp', 'When HP <50%: +15 Physical & Magic Defense'),
    ],
    core: [
      t('Concussive Blast', 'Concussive_Blasts.webp', 'After next basic attack, deal 100 (+7% Total HP) Magic Damage to nearby enemies. CD 15s'),
    ],
  },
  {
    id: 'assassin', name: 'Assassin',
    icon: `${API_BASE}/images/emblems/assassin.webp`,
    color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)',
    attrs: ['Adaptive Penetration +14', 'Adaptive Attack +10', 'Move Speed +3%'],
    standard: [
      t('Rupture',         'Rupture.webp',         '+5 Adaptive Penetration (Physical or Magic depending on stats)'),
      t('Master Assassin', 'Master_Assassin.webp', '+7% damage when only one enemy hero is nearby'),
    ],
    core: [
      t('Killing Spree', 'Killing_Spree.webp', 'After killing an enemy hero: recover 15% lost HP & +20% Move Speed for 3s'),
    ],
  },
  {
    id: 'mage', name: 'Mage',
    icon: `${API_BASE}/images/emblems/mage.webp`,
    color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)',
    attrs: ['Magic Power +30', 'Cooldown Reduction +5%', 'Magic Penetration +8'],
    standard: [
      t('Inspire',        'Inspire_Talent.webp', '+5% Cooldown Reduction'),
      t('Bargain Hunter', 'Bargain_Hunter.webp',  'Equipment purchased at 95% of base price'),
    ],
    core: [
      t('Lethal Ignition', 'Lethal_Ignition.webp', 'Dealing >7% of target Max HP damage 3 times in 5s scorches them for 162–750 Adaptive Damage. CD 15s'),
    ],
  },
  {
    id: 'fighter', name: 'Fighter',
    icon: `${API_BASE}/images/emblems/fighter.webp`,
    color: '#F97316', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.4)',
    attrs: ['Spell Vamp +10%', 'Adaptive Attack +22', 'Hybrid Defense +6'],
    standard: [
      t('Firmness',          'Firmness.webp',          '+6 Physical & Magic Defense'),
      t('Festival of Blood', 'Festival_of_Blood.webp', '+6% Spell Vamp; each kill/assist adds 0.5% (up to 8 stacks)'),
    ],
    core: [
      t('Brave Smite', 'Brave_Smite.webp', 'Dealing skill damage to an enemy hero recovers 5% Max HP. CD 6s'),
    ],
  },
  {
    id: 'support', name: 'Support',
    icon: `${API_BASE}/images/emblems/support.webp`,
    color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)',
    attrs: ['Healing Effect +12%', 'Cooldown Reduction +10%', 'Move Speed +6%'],
    standard: [
      t('Agility',                'Agility.webp',                '+4% Movement Speed'),
      t('Pull Yourself Together', 'Pull_Yourself_Together.webp', '-15% cooldown on Battle Spell & active equipment'),
    ],
    core: [
      t('Focusing Mark', 'Focusing_Mark.webp', "Hitting an enemy hero increases allied heroes' damage to them by 6% for 3s. CD 4s"),
    ],
  },
  {
    id: 'marksman', name: 'Marksman',
    icon: `${API_BASE}/images/emblems/marksman.webp`,
    color: '#EAB308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)',
    attrs: ['Attack Speed +15%', 'Adaptive Attack +16', 'Lifesteal +5%'],
    standard: [
      t('Fatal',         'Fatal.webp',          '+5% Crit Chance & +10% Crit Damage'),
      t('Weapon Master', 'Weapon_Master.webp',  '+5% Physical Attack & Magic Power from equipment, emblem, talents & skills'),
    ],
    core: [
      t('Weakness Finder', 'Weakness_Finder.webp', 'Basic attacks slow enemies 50% & reduce Attack Speed 30% for 1s. CD 10s (−1s per hit, min 3s)'),
    ],
  },
];
